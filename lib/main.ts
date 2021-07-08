import { readFileSync, writeFileSync, existsSync, copySync, mkdirSync, removeSync } from 'fs-extra';

import { v4 } from 'uuid';

import { Generate } from '@lib/generate';

import { Link } from '@lib/link';
import { Importer } from '@lib/importer';
import { Dir } from '@lib/dir';
import { Logger } from '@lib/logger';
import { WorkerController } from '@lib/worker/controller';
import { Config } from '@lib/config';
import { Env } from '@lib/env';
import { EnvModel } from '@lib/model/env';
import { WorkerAction } from '@lib/model/worker/action';
import { WorkerStatus } from '@lib/model/worker/status';
import { IPerformance_Measure, Performance_Measure, Performance_Measure_Blank } from '@lib/performance_measure';
import { File } from '@lib/file';
import { Client } from '@lib/client';
import { dirname, join, sep } from 'path';
import { hrtime_to_ms } from '@lib/converter/time';
import { Routes } from '@lib/routes';
import { Watch } from '@lib/watch';
import merge from 'deepmerge';
import { Dependency } from '@lib/dependency';
import { Plugin } from './plugin';
import { Optimize } from './optimize';
import { Publish } from './publish';

export class Main {
    worker_controller: WorkerController = null;
    perf: IPerformance_Measure;
    worker_amount: number;
    global_data: any = null;
    identifiers: any = {};
    is_executing: boolean = false;
    cwd = process.cwd();
    uniq_id = v4().split('-')[0];
    release_path = null;
    package_tree = {};

    constructor() {
        Env.set(process.env.WYVR_ENV);
        this.init();
    }
    async init() {
        const hr_start = process.hrtime();
        const pid = process.pid;
        process.title = `wyvr main ${pid}`;
        Logger.logo();
        Logger.present('PID', pid, Logger.color.dim(`"${process.title}"`));
        Logger.present('cwd', this.cwd);
        Logger.present('build', this.uniq_id);
        Logger.present('env', EnvModel[Env.get()]);

        this.perf = Config.get('import.measure_performance') ? new Performance_Measure() : new Performance_Measure_Blank();

        Dir.clear('gen');
        Dir.create('releases');
        const keep = Config.get('releases.keep') ?? 0;
        const deleted_releases = Publish.cleanup(keep);
        Logger.info(`keep ${keep} release(s), deleted ${deleted_releases.length}`);
        this.release_path = `releases/${this.uniq_id}`;
        Dir.create(this.release_path);

        Logger.stop('config', hrtime_to_ms(process.hrtime(hr_start)));

        // collect configured package
        this.perf.start('packages');
        const packages = await this.packages();
        this.perf.end('packages');
        Logger.debug('project_config', JSON.stringify(Config.get(), null, 4));

        // import the data source
        let datasets_total = null;
        let is_imported = false;
        const importer = new Importer();

        const import_global_path = Config.get('import.global');
        if (existsSync(import_global_path)) {
            try {
                this.global_data = File.read_json(import_global_path);
            } catch (e) {
                Logger.warning('import global file does not exist', import_global_path);
            }
        }
        this.global_data.env = EnvModel[Env.get()];
        this.global_data.url = Config.get('url');
        const import_main_path = Config.get('import.main');
        const default_values = Config.get('default_values');
        if (import_main_path && existsSync(import_main_path)) {
            try {
                datasets_total = await importer.import(
                    import_main_path,
                    (data: { key: number; value: any }) => {
                        data.value = this.generate(data.value, false, default_values);
                        return data;
                    },
                    () => {
                        is_imported = true;
                        importer.set_global(this.global_data);
                    }
                );
            } catch (e) {
                Logger.error(e);
                return;
            }
            if (!datasets_total) {
                Logger.error('no datasets found');
                return;
            }
            if (!is_imported) {
                this.global_data = await importer.get_global();
            }
        }

        this.perf.start('worker');

        this.worker_controller = new WorkerController(this.global_data, this.release_path);
        this.worker_amount = this.worker_controller.get_worker_amount();
        Logger.present('workers', this.worker_amount, Logger.color.dim(`of ${require('os').cpus().length} cores`));
        const workers = this.worker_controller.create_workers(this.worker_amount);
        const gen_src_folder = join(this.cwd, 'gen', 'src');
        // watcher when worker sends identifier content
        this.worker_controller.events.on('emit', 'identifier', (data: any) => {
            this.identifiers[data.identifier] = {
                name: data.identifier.replace(gen_src_folder + '/', ''),
                doc: data.doc.replace(gen_src_folder + '/', ''),
                layout: data.layout.replace(gen_src_folder + '/', ''),
                page: data.page.replace(gen_src_folder + '/', ''),
            };
        });
        this.perf.end('worker');

        // execute
        await this.execute(importer.get_import_list());

        // save config fo debugging
        writeFileSync('gen/config.json', JSON.stringify(Config.get(), null, 4));

        const timeInMs = hrtime_to_ms(process.hrtime(hr_start));
        Logger.stop('initial total', timeInMs);

        if (Env.is_prod()) {
            Logger.success('shutdown');
            process.exit(0);
            return;
        }
        // watch for file changes
        try {
            const watch = new Watch(async (changed_files: any[]) => {
                Plugin.clear();
                await this.execute(importer.get_import_list(), changed_files);
            });
        } catch (e) {
            Logger.warning(e);
            this.fail();
        }
    }
    async packages() {
        const packages = Config.get('packages');
        const disabled_packages = [];
        const available_packages = [];
        if (packages && Array.isArray(packages)) {
            let config: any = {};
            // reset the config
            Config.set({ packages: null });
            packages.forEach((pkg, index) => {
                // set default name for the config
                if (!pkg.name) {
                    pkg.name = '#' + index;
                }
                // load the package config
                const package_config = Config.load_from_path(pkg.path);
                if (package_config) {
                    config = Config.merge(config, package_config);
                }
                if (existsSync(pkg.path)) {
                    available_packages.push(pkg);
                    return;
                }

                disabled_packages.push(pkg);
            });
            // update config, but keep the main config values
            Config.replace(Config.merge(config, Config.get()));
            // update the packages in the config
            const new_config = { packages: available_packages };
            Logger.debug('update packages', JSON.stringify(new_config));
            Config.set(new_config);
        }
        Logger.present(
            'packages',
            available_packages
                ?.map((pkg) => {
                    return `${pkg.name}@${Logger.color.dim(pkg.path)}`;
                })
                .join(' ')
        );
        if (disabled_packages.length) {
            Logger.warning(
                'disabled packages',
                disabled_packages
                    .map((pkg) => {
                        return `${pkg.name}@${Logger.color.dim(pkg.path)}`;
                    })
                    .join(' ')
            );
        }

        return packages;
    }
    copy_static_files() {
        const packages = Config.get('packages');
        if (packages) {
            packages.forEach((pkg) => {
                // copy the files from the package to the project
                ['assets', 'routes', 'plugins'].forEach((part) => {
                    if (existsSync(join(pkg.path, part))) {
                        // store the info which file comes from which package
                        const pkg_part_path = join(pkg.path, part);
                        File.collect_files(pkg_part_path)
                            .map((file) => file.replace(pkg.path + sep, ''))
                            .forEach((file) => {
                                this.package_tree[file] = pkg;
                            });
                        copySync(join(pkg.path, part), join(this.cwd, 'gen', part));
                    }
                });
            });
        }
        // copy configured assets into release
        const assets = Config.get('assets');
        if (assets) {
            assets.forEach((entry) => {
                if (entry.src && existsSync(entry.src)) {
                    const target = join(this.cwd, 'gen/assets', entry.target);
                    Logger.debug('copy asset from', entry.src, 'to', target);
                    copySync(entry.src, target);
                } else {
                    Logger.warning('can not copy asset', entry.src, 'empty or not existing');
                }
            });
        }
    }
    async collect() {
        const packages = Config.get('packages');
        await Plugin.before('collect', packages);
        if (packages) {
            let config = {};
            Dir.create('gen/raw');
            packages.forEach((pkg) => {
                // copy the files from the package to the project gen/raw
                ['src'].forEach((part) => {
                    if (existsSync(join(pkg.path, part))) {
                        // store the info which file comes from which package
                        const pkg_part_path = join(pkg.path, part);
                        File.collect_files(pkg_part_path)
                            .map((file) => file.replace(pkg.path + sep, ''))
                            .forEach((file) => {
                                this.package_tree[file] = pkg;
                            });
                        copySync(join(pkg.path, part), join(this.cwd, 'gen/raw'));
                    }
                });
            });
        }
        copySync('gen/raw', 'gen/src');
        await Plugin.after('collect', packages);
        return true;
    }
    async routes(file_list: any[], enhance_data: boolean = true) {
        await Plugin.before('routes', file_list, enhance_data);
        const routes = Routes.collect_routes(null, this.package_tree);
        if (!routes || routes.length == 0) {
            return file_list;
        }

        const on_global_index = this.worker_controller.events.on('emit', 'global', (data) => {
            // add the results to the global data
            if (data) {
                this.global_data = merge(this.global_data, data.data);
            }
        });

        const result = await this.worker_controller.process_in_workers(
            'routes',
            WorkerAction.route,
            routes.map((route_path) => ({
                route: route_path,
                add_to_global: !!enhance_data,
            })),
            1
        );

        this.worker_controller.events.off('emit', 'global', on_global_index);
        await Plugin.after('routes', file_list, enhance_data);
        // Logger.info('routes amount', routes_urls.length);
        // return [].concat(file_list, routes_urls);
        return file_list;
    }
    async transform() {
        const svelte_files = File.collect_svelte_files('gen/src');
        await Plugin.before('transform', svelte_files);
        // combine svelte files
        svelte_files.map((file) => {
            const raw_content = readFileSync(file.path, { encoding: 'utf-8' });
            const [pre_error, preprocessed_content] = Client.preprocess_content(raw_content);
            if (pre_error) {
                Logger.error(pre_error);
            }
            const combined_content = Client.insert_splits(file.path, pre_error ? raw_content : preprocessed_content);
            const content = Client.replace_global(combined_content, this.global_data);
            writeFileSync(file.path, content);
        });
        // search for hydrateable files
        const hydrateable_files = Client.get_hydrateable_svelte_files(svelte_files);

        // copy the hydrateable files into the gen/client folder
        Dir.clear('gen/client');
        // copy js files to client, because stores and additional logic is "hidden" there
        File.collect_files('gen/src', '.js').map((js_file) => {
            copySync(js_file, js_file.replace(/^gen\/src/, 'gen/client'));
        });
        hydrateable_files.map((file) => {
            const source_path = file.path;
            const path = file.path.replace(/^gen\/src/, 'gen/client');
            mkdirSync(dirname(path), { recursive: true });
            writeFileSync(path, Client.remove_on_server(Client.replace_slots_client(readFileSync(source_path, { encoding: 'utf-8' }))));
            return file;
        });
        // correct the import paths in the static files
        Client.correct_svelte_file_import_paths(svelte_files);

        // @todo replace global in the svelte components which should be hydrated
        const transformed_files = Client.transform_hydrateable_svelte_files(hydrateable_files);
        await Plugin.after('transform', transformed_files);
        return {
            src: svelte_files,
            client: transformed_files,
        };
    }
    async build(list: string[]): Promise<[string[], string[]]> {
        // clear css files otherwise these will not be regenerated, because the build step only creates the file when it is not present already
        removeSync(join('gen', 'css'));

        mkdirSync('gen/src', { recursive: true });
        await Plugin.before('build', list);
        Logger.info('build datasets', list.length);
        const paths = [];
        const css_parents = [];
        const on_build_index = this.worker_controller.events.on('emit', 'build', (data) => {
            // add the results to the build file list
            if (data) {
                paths.push(...data.data);
            }
        });
        const on_css_index = this.worker_controller.events.on('emit', 'css_parent', (data) => {
            // add the results to the build file list
            if (data && data.data) {
                if (Array.isArray(data.data)) {
                    css_parents.push(...data.data);
                    return;
                }
                css_parents.push(data.data);
            }
        });

        const result = await this.worker_controller.process_in_workers('build', WorkerAction.build, list, 100);
        this.worker_controller.events.off('emit', 'build', on_build_index);
        this.worker_controller.events.off('emit', 'css_parent', on_css_index);
        await Plugin.after('build', result, paths);
        return [paths, css_parents];
    }
    async scripts(): Promise<boolean> {
        await Plugin.before('scripts', this.identifiers, Dependency.cache);
        Dir.clear('gen/js');

        // copy static component which are imported into hydrated components into the gen/client folder to avoid errors
        const hydrateable_files = Client.get_hydrateable_svelte_files(File.collect_svelte_files('gen/client')).map((file) => {
            return file.path.replace('gen/client/', '');
        });
        hydrateable_files.forEach((file_path) => {
            const group = file_path.split('/')[0];
            if (Dependency.cache[group]) {
                if (Dependency.cache[group][file_path]) {
                    Dependency.cache[group][file_path].forEach((dep_file) => {
                        if (hydrateable_files.indexOf(dep_file) == -1) {
                            // this dependency file is not hydrateable and must be copied to the client folder
                            const path = join(this.cwd, 'gen', 'client', dep_file);
                            if (!existsSync(path)) {
                                Logger.warning('dependency', dep_file, 'does not exist');
                                return;
                            }
                            mkdirSync(dirname(path), { recursive: true });
                            writeFileSync(
                                path,
                                Client.remove_on_server(
                                    Client.replace_slots_client(readFileSync(join(this.cwd, 'gen', 'src', dep_file), { encoding: 'utf-8' }))
                                )
                            );
                            Logger.debug('make the static file', dep_file, 'hydrateable because it is used inside the hydrateable file', file_path);
                        }
                    });
                }
            }
        });

        const list = Object.keys(this.identifiers).map((key) => {
            return { file: this.identifiers[key], dependency: Dependency.cache };
        });
        const result = await this.worker_controller.process_in_workers('scripts', WorkerAction.scripts, list, 1);
        await Plugin.after('scripts', result);
        return result;
    }

    generate(data, ignore_global: boolean = false, default_values: any = null) {
        // enhance the data from the pages
        // set default values when the key is not available in the given data
        data = Generate.set_default_values(Generate.enhance_data(data), default_values);

        if (ignore_global) {
            return data;
        }
        this.global_data = Generate.add_to_global(data, this.global_data);
        return data;
    }

    fail() {
        Logger.error('failed');
        process.exit(1);
    }

    async execute(file_list: any[], changed_files: { event: string; path: string; rel_path: string }[] = []) {
        this.is_executing = true;

        const is_regenerating = changed_files.length > 0;

        const only_static = is_regenerating && changed_files.every((file) => file.rel_path.match(/^assets\//));

        this.perf.start('static');
        this.copy_static_files();
        this.perf.end('static');

        this.perf.start('plugins');
        await this.plugins();
        this.perf.end('plugins');

        if (only_static) {
            this.is_executing = false;
            return;
        }

        // collect the files for the generation
        this.perf.start('collect');
        await this.collect();
        this.perf.end('collect');

        const contains_routes = changed_files.find((file) => file.rel_path.match(/^routes\//)) != null;
        if (!is_regenerating || contains_routes) {
            // get the route files
            this.perf.start('routes');
            await this.routes(file_list, !is_regenerating);
            this.perf.end('routes');
        } else {
            Logger.improve('routes, will not be regenerated');
        }

        this.perf.start('transform');
        const collected_files = await this.transform();
        if (!collected_files) {
            this.fail();
        }
        this.perf.end('transform');

        this.perf.start('build');
        // read all imported files
        const files = File.collect_files(join(this.cwd, 'imported', 'data'), 'json');
        // build static files
        const [build_pages, css_parents] = await this.build(files);
        this.perf.end('build');

        // check if the execution should stop after the build
        const collected_client_files = collected_files.client.map((file) => file.path.replace('gen/', ''));
        const exec_scripts =
            !is_regenerating ||
            changed_files.some((file) => {
                if (!file.rel_path.match(/^src\//)) {
                    return false;
                }
                return collected_client_files.indexOf(file.rel_path) > -1;
            });

        if (exec_scripts) {
            this.perf.start('dependencies');
            Dependency.build();
            this.perf.end('dependencies');

            this.perf.start('scripts');
            const build_scripts = await this.scripts();
            this.perf.end('scripts');
        } else {
            Logger.improve('scripts, will not be regenerated');
        }

        this.perf.start('sitemap');
        await this.sitemap();
        this.perf.end('sitemap');

        this.perf.start('link');
        await this.link();
        this.perf.end('link');

        if (Env.is_dev()) {
            Logger.improve('optimize will not be executed in dev mode');
        } else {
            this.perf.start('optimize');
            await this.optimize(css_parents);
            this.perf.end('optimize');
        }

        this.perf.start('release');
        await this.release();
        this.perf.end('release');

        this.perf.start('publish');
        await this.publish();
        this.perf.end('publish');

        this.worker_controller.cleanup();
        this.is_executing = false;
    }
    async sitemap() {
        const [error, config, files] = await Plugin.before('sitemap', [
            {
                name: 'sitemap.xml',
                entries: [],
            },
        ]);
        if (error) {
            Logger.error(error);
            this.fail();
        }
        // console.log(JSON.stringify(files))
        files.forEach((file) => {
            if (!file || !file.name || !file.entries) {
                return;
            }
            writeFileSync(join(this.release_path, file.name), JSON.stringify(file.entries, null, 4));
        });
        return files;
    }
    async plugins() {
        const plugin_files = File.collect_files(join('gen', 'plugins'));
        await Plugin.init(plugin_files, {
            release_path: this.release_path,
        });

        return null;
    }

    async optimize(identifier_list: any[]) {
        // add contenthash to the generated files
        const replace_hash_files = [];
        const [hash_list, file_list] = Optimize.get_hashed_files();
        // replace in the files itself
        Optimize.replace_hashed_files_in_files(file_list, hash_list);

        const [error_before, config_before, identifier_list_before, replace_hash_files_before] = await Plugin.before(
            'optimize',
            identifier_list,
            replace_hash_files
        );
        if (error_before) {
            Logger.error(error_before);
            this.fail();
        }
        // create the list of files with there hashed identifier elements css/js
        const indexed = {};
        identifier_list_before.forEach((entry) => {
            if (!indexed[entry.identifier]) {
                indexed[entry.identifier] = entry;
                indexed[entry.identifier].files = [];
                indexed[entry.identifier].hash_list = hash_list;
            }
            indexed[entry.identifier].files.push(entry.path);
        });
        const list = Object.keys(indexed).map((key) => indexed[key]);

        const result = await this.worker_controller.process_in_workers('optimize', WorkerAction.optimize, list, 1);

        const [error_after, config_after, list_after] = await Plugin.after('optimize', list);
        if (error_after) {
            Logger.error(error_after);
            this.fail();
        }
        return result;
    }
    async link() {
        const [error_before] = await Plugin.before('link');
        if (error_before) {
            Logger.error(error_before);
            this.fail();
        }
        // symlink the "static" folders to release
        Link.to('gen/assets', `releases/${this.uniq_id}/assets`);
        Link.to('gen/js', `releases/${this.uniq_id}/js`);
        Link.to('gen/css', `releases/${this.uniq_id}/css`);

        const [error_after] = await Plugin.after('link');
        if (error_after) {
            Logger.error(error_after);
            this.fail();
        }
    }
    async release() {
        const [error_before] = await Plugin.before('release');
        if (error_before) {
            Logger.error(error_before);
            this.fail();
        }
        if (Env.is_prod()) {
            // in production copy the static folders
            ['assets', 'js', 'css'].forEach((folder) => {
                removeSync(`releases/${this.uniq_id}/${folder}`);
                copySync(`gen/${folder}`, `releases/${this.uniq_id}/${folder}`);
            });
        }
        const [error_after] = await Plugin.after('release');
        if (error_after) {
            Logger.error(error_after);
            this.fail();
        }
    }
    async publish() {
        Publish.release(this.uniq_id);
    }
}
