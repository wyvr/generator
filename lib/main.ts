import * as fs from 'fs-extra';

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
import { Queue } from '@lib/queue';
import { WorkerAction } from '@lib/model/worker/action';
import { WorkerStatus } from '@lib/model/worker/status';
import { IPerformance_Measure, Performance_Measure, Performance_Measure_Blank } from '@lib/performance_measure';
import { File } from '@lib/file';
import { Client } from '@lib/client';
import { dirname, join } from 'path';
import { hrtime_to_ms } from '@lib/converter/time';
import { Routes } from '@lib/routes';
import { Watch } from '@lib/watch';
import merge from 'deepmerge';
import { Dependency } from '@lib/dependency';
import { Plugin } from './plugin';

export class Main {
    queue: Queue = null;
    worker_controller: WorkerController = null;
    perf: IPerformance_Measure;
    worker_amount: number;
    global_data: any = null;
    entrypoints: any = {};
    is_executing: boolean = false;
    cwd = process.cwd();
    constructor() {
        Env.set(process.env.WYVR_ENV);
        this.init();
    }
    async init() {
        const hr_start = process.hrtime();
        const uniq_id = v4().split('-')[0];
        const pid = process.pid;
        process.title = `wyvr main ${pid}`;
        Logger.logo();
        Logger.present('PID', pid, Logger.color.dim(`"${process.title}"`));
        Logger.present('cwd', this.cwd);
        Logger.present('build', uniq_id);
        Logger.present('env', EnvModel[Env.get()]);

        this.perf = Config.get('import.measure_performance') ? new Performance_Measure() : new Performance_Measure_Blank();

        Dir.clear('gen');
        Dir.create('pub');

        Logger.stop('config', hrtime_to_ms(process.hrtime(hr_start)));

        // collect configured themes
        this.perf.start('themes');
        const themes = await this.themes();
        this.perf.end('themes');
        Logger.debug('project_config', JSON.stringify(Config.get(), null, 4));

        // import the data source
        let datasets_total = null;
        let is_imported = false;
        const importer = new Importer();

        const import_global_path = Config.get('import.global');
        if (fs.existsSync(import_global_path)) {
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
        if (import_main_path && fs.existsSync(import_main_path)) {
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

        this.worker_controller = new WorkerController(this.global_data);
        this.worker_amount = this.worker_controller.get_worker_amount();
        Logger.present('workers', this.worker_amount, Logger.color.dim(`of ${require('os').cpus().length} cores`));
        const workers = this.worker_controller.create_workers(this.worker_amount);
        const gen_src_folder = join(this.cwd, 'gen', 'src');
        this.worker_controller.events.on('emit', 'entrypoint', (data: any) => {
            this.entrypoints[data.entrypoint] = {
                name: data.entrypoint.replace(gen_src_folder + '/', ''),
                doc: data.doc.replace(gen_src_folder + '/', ''),
                layout: data.layout.replace(gen_src_folder + '/', ''),
                page: data.page.replace(gen_src_folder + '/', ''),
            };
        });
        this.perf.end('worker');

        // execute
        await this.execute(importer.get_import_list());

        // save config fo debugging
        fs.writeFileSync('gen/config.json', JSON.stringify(Config.get(), null, 4));

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
    async themes() {
        const themes = Config.get('themes');
        const disabled_themes = [];
        const available_themes = [];
        if (themes && Array.isArray(themes)) {
            let config: any = {};
            // reset the config
            Config.set({ themes: null });
            themes.forEach((theme, index) => {
                // set default name for the config
                if (!theme.name) {
                    theme.name = '#' + index;
                }
                // load the theme config
                const theme_config = Config.load_from_path(theme.path);
                if (theme_config) {
                    config = Config.merge(config, theme_config);
                }
                if (fs.existsSync(theme.path)) {
                    available_themes.push(theme);
                    return;
                }

                disabled_themes.push(theme);
            });
            // update config, but keep the main config values
            Config.replace(Config.merge(config, Config.get()));
            // update the themes in the config
            const new_config = { themes: available_themes };
            Logger.debug('update themes', JSON.stringify(new_config));
            Config.set(new_config);
        }
        Logger.present(
            'themes',
            available_themes
                ?.map((theme) => {
                    return `${theme.name}@${Logger.color.dim(theme.path)}`;
                })
                .join(' ')
        );
        if (disabled_themes.length) {
            Logger.warning(
                'disabled themes',
                disabled_themes
                    .map((theme) => {
                        return `${theme.name}@${Logger.color.dim(theme.path)}`;
                    })
                    .join(' ')
            );
        }

        return themes;
    }
    copy_static_files() {
        const themes = Config.get('themes');
        if (themes) {
            themes.forEach((theme) => {
                // copy the files from the theme to the project
                ['assets', 'routes', 'plugins'].forEach((part) => {
                    if (fs.existsSync(join(theme.path, part))) {
                        fs.copySync(join(theme.path, part), join(this.cwd, 'gen', part));
                    }
                });
            });
        }
        const assets = Config.get('assets');
        if (assets) {
            assets.forEach((entry) => {
                if (entry.src && fs.existsSync(entry.src)) {
                    const target = join(this.cwd, 'gen/assets', entry.target);
                    Logger.debug('copy asset from', entry.src, 'to', target);
                    fs.copySync(entry.src, target);
                } else {
                    Logger.warning('can not copy asset', entry.src, 'empty or not existing');
                }
            });
        }
    }
    async collect() {
        const themes = Config.get('themes');
        await Plugin.before('collect', [themes]);
        if (themes) {
            let config = {};
            Dir.create('gen/raw');
            themes.forEach((theme) => {
                // copy the files from the theme to the project gen/raw
                ['src'].forEach((part) => {
                    if (fs.existsSync(join(theme.path, part))) {
                        fs.copySync(join(theme.path, part), join(this.cwd, 'gen/raw'));
                    }
                });
            });
        }
        fs.copySync('gen/raw', 'gen/src');
        await Plugin.after('collect', [themes]);
        return true;
    }
    async routes(file_list: any[], enhance_data: boolean = true) {
        await Plugin.before('routes', [file_list, enhance_data]);
        const routes = Routes.collect_routes();
        if (!routes || routes.length == 0) {
            return file_list;
        }

        const on_global_index = this.worker_controller.events.on('emit', 'global', (data) => {
            // add the results to the global data
            if (data) {
                this.global_data = merge(this.global_data, data.data);
            }
        });

        const result = await this.process_in_workers(
            'routes',
            WorkerAction.route,
            routes.map((route_path) => ({
                route: route_path,
                add_to_global: !!enhance_data,
            })),
            1
        );

        this.worker_controller.events.off('emit', 'global', on_global_index);
        await Plugin.after('routes', [file_list, enhance_data]);
        // Logger.info('routes amount', routes_urls.length);
        // return [].concat(file_list, routes_urls);
        return file_list;
    }
    async transform() {
        const svelte_files = File.collect_svelte_files('gen/src');
        await Plugin.before('transform', [svelte_files]);
        // combine svelte files
        svelte_files.map((file) => {
            const raw_content = fs.readFileSync(file.path, { encoding: 'utf-8' });
            const combined_content = Client.insert_splits(file.path, raw_content);
            const content = Client.replace_global(combined_content, this.global_data);
            fs.writeFileSync(file.path, content);
        });
        // search for hydrateable files
        const hydrateable_files = Client.get_hydrateable_svelte_files(svelte_files);

        // copy the hydrateable files into the gen/client folder
        Dir.clear('gen/client');
        hydrateable_files.map((file) => {
            const source_path = file.path;
            const path = file.path.replace(/^gen\/src/, 'gen/client');
            fs.mkdirSync(dirname(path), { recursive: true });
            fs.writeFileSync(path, Client.remove_on_server(Client.replace_slots_client(fs.readFileSync(source_path, { encoding: 'utf-8' }))));
            return file;
        });
        // correct the import paths in the static files
        Client.correct_svelte_file_import_paths(svelte_files);

        // @todo replace global in the svelte components which should be hydrated
        const transformed_files = Client.transform_hydrateable_svelte_files(hydrateable_files);
        await Plugin.after('transform', [transformed_files]);
        return {
            src: svelte_files,
            client: transformed_files,
        };
    }
    async build(list: string[]): Promise<[string[], string[]]> {
        fs.mkdirSync('gen/src', { recursive: true });
        await Plugin.before('build', [list]);
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
            if (data) {
                css_parents.push(data.data);
            }
        });

        const result = await this.process_in_workers('build', WorkerAction.build, list, 100);
        this.worker_controller.events.off('emit', 'build', on_build_index);
        this.worker_controller.events.off('emit', 'css_parent', on_css_index);
        await Plugin.after('build', [result, paths]);
        return [paths, css_parents];
    }
    async scripts(): Promise<boolean> {
        await Plugin.before('scripts', [this.entrypoints, Dependency.cache]);
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
                            fs.mkdirSync(dirname(path), { recursive: true });
                            fs.writeFileSync(
                                path,
                                Client.remove_on_server(
                                    Client.replace_slots_client(fs.readFileSync(join(this.cwd, 'gen', 'src', dep_file), { encoding: 'utf-8' }))
                                )
                            );
                            if (Env.is_dev()) {
                                Logger.warning('make the static file', dep_file, 'hydrateable because it is used inside the hydrateable file', file_path);
                            } else {
                                Logger.debug('make the static file', dep_file, 'hydrateable because it is used inside the hydrateable file', file_path);
                            }
                        }
                    });
                }
            }
        });

        const list = Object.keys(this.entrypoints).map((key) => {
            return { file: this.entrypoints[key], dependency: Dependency.cache };
        });
        const result = await this.process_in_workers('scripts', WorkerAction.scripts, list, 1);
        await Plugin.after('scripts', [result]);
        return result;
    }
    ticks: number = 0;
    tick(queue: Queue): boolean {
        const workers = this.worker_controller.get_idle_workers();
        Logger.debug('tick', this.ticks, 'idle workers', workers.length, 'queue', queue.length);
        this.ticks++;
        if (workers.length == this.worker_amount && queue.length == 0) {
            return true;
        }
        if (queue.length > 0) {
            // get all idle workers
            if (workers.length > 0) {
                workers.forEach((worker) => {
                    const queue_entry = queue.take();
                    if (queue_entry != null) {
                        // set worker busy otherwise the same worker gets multiple actions send
                        worker.status = WorkerStatus.busy;
                        // send the data to the worker
                        this.worker_controller.send_action(worker.pid, queue_entry.action, queue_entry.data);
                    }
                });
            }
        }
        return false;
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

        if (!is_regenerating) {
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

        this.perf.start('optimize');
        await this.optimize(build_pages, collected_files, css_parents);
        this.perf.end('optimize');

        this.worker_controller.cleanup();
        this.is_executing = false;
    }
    async sitemap() {
        const [error, files] = await Plugin.before('sitemap', [
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
            fs.writeFileSync(join('pub', file.name), JSON.stringify(file.entries, null, 4));
        });
        return files;
    }
    async plugins() {
        const plugin_files = File.collect_files(join('gen', 'plugins'));
        await Plugin.init(plugin_files);

        return null;
    }
    async process_in_workers(name: string, action: WorkerAction, list: any[], batch_size: number = 10): Promise<boolean> {
        const amount = list.length;
        Logger.info('process', amount, 'items, batch size', Logger.color.cyan(batch_size.toString()));
        // create new queue
        this.queue = new Queue();

        let iterations = Math.ceil(amount / batch_size);
        Logger.debug('process iterations', iterations);

        for (let i = 0; i < iterations; i++) {
            const queue_data = {
                action,
                data: list.slice(i * batch_size, (i + 1) * batch_size),
            };
            this.queue.push(queue_data);
        }
        const size = this.queue.length;
        let done = 0;
        return new Promise((resolve, reject) => {
            const idle = this.worker_controller.get_idle_workers();
            const listener_id = this.worker_controller.events.on('worker_status', WorkerStatus.idle, () => {
                if (this.tick(this.queue)) {
                    this.worker_controller.events.off('worker_status', WorkerStatus.idle, listener_id);
                    resolve(true);
                }
            });
            // when all workers are idle, emit on first
            if (idle.length > 0 && idle.length == this.worker_controller.get_worker_amount()) {
                this.worker_controller.livecycle(idle[0]);
            }
            const done_listener_id = this.worker_controller.events.on('worker_status', WorkerStatus.done, () => {
                done++;
                Logger.text(name, Logger.color.dim('...'), `${Math.round((100 / size) * done)}%`, Logger.color.dim(`${done}/${size}`));
                if (done == size) {
                    this.worker_controller.events.off('worker_status', WorkerStatus.done, done_listener_id);
                }
            });
        });
    }
    async optimize(files: any[], collected_files: any, entrypoint_list: any[]) {
        if(Env.is_dev()) {
            Logger.improve('optimize will not be executed in dev mode');
            return null;
        }
        const indexed = {};
        entrypoint_list.forEach((entry) => {
            if (!indexed[entry.entrypoint]) {
                indexed[entry.entrypoint] = entry;
                indexed[entry.entrypoint].files = [];
            }
            indexed[entry.entrypoint].files.push(entry.path);
        });
        const list = Object.keys(indexed).map((key) => indexed[key]);

        const result = await this.process_in_workers('optimize', WorkerAction.optimize, list, 1);
        return result;
    }
    async link() {
        // symlink the "static" folders to pub
        Link.to_pub('gen/assets', 'assets');
        Link.to_pub('gen/js', 'js');
        Link.to_pub('gen/css', 'css');
    }
}
