import { readFileSync, writeFileSync, existsSync, copySync, mkdirSync, removeSync } from 'fs-extra';
import { dirname, join, sep } from 'path';

import { Publish } from '@lib/publish';
import { WyvrMode } from '@lib/model/wyvr/mode';
import { Logger } from '@lib/logger';
import { Dir } from '@lib/dir';
import { Plugin } from '@lib/plugin';
import { Env } from '@lib/env';
import { Link } from '@lib/link';
import { Optimize } from '@lib/optimize';
import { WorkerAction } from '@lib/model/worker/action';
import { WorkerController } from '@lib/worker/controller';
import { File } from '@lib/file';
import { Generate } from '@lib/generate';
import { Config } from '@lib/config';
import { Routes } from '@lib/routes';
import { Client } from '@lib/client';
import { Dependency } from '@lib/dependency';
import { Error } from '@lib/error';
import { Route } from '@lib/model/route';
import { Global } from '@lib/global';
import { hrtime_to_ms } from '../converter/time';

export class MainHelper {
    cwd = process.cwd();
    root_template_paths = [join(this.cwd, 'gen', 'src', 'doc'), join(this.cwd, 'gen', 'src', 'layout'), join(this.cwd, 'gen', 'src', 'page')];

    generate(data, ignore_global: boolean = false, default_values: any = null) {
        // enhance the data from the pages
        // set default values when the key is not available in the given data
        return Generate.set_default_values(Generate.enhance_data(data), default_values);
    }
    async packages() {
        let package_json = null;
        if (!package_json && existsSync('package.json')) {
            try {
                package_json = JSON.parse(readFileSync('package.json', { encoding: 'utf-8' }));
            } catch (e) {
                Logger.error(Error.extract(e, 'package.json'));
            }
        }
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

                // search inside the node_modules folder
                if (package_json && pkg.name && !pkg.path) {
                    if (existsSync(join('node_modules', pkg.name))) {
                        pkg.path = join('node_modules', pkg.name);
                    }
                    // search if the package is linked in the package json
                    if (!pkg.path) {
                        pkg.path = Object.keys(package_json.dependencies || {})
                            .map((package_name) => {
                                if (package_name != pkg.name) {
                                    return null;
                                }
                                return package_json.dependencies[package_name].match(/file:(.*)/)[1];
                            })
                            .find((x) => x);
                    }
                }
                // load the package config
                const package_config = Config.load_from_path(pkg.path);
                if (package_config) {
                    config = Config.merge(config, package_config);
                }
                // check if the package is outside the node_modules folder
                if (pkg.path && existsSync(pkg.path)) {
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
                    return `${pkg.name}`;
                })
                .join(', ')
        );
        if (disabled_packages.length) {
            Logger.warning(
                'disabled packages',
                disabled_packages
                    .map((pkg) => {
                        return `${pkg.name}${Logger.color.dim('@' + pkg.path)}`;
                    })
                    .join(' ')
            );
        }

        return packages;
    }
    copy_static_files(package_tree) {
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
                                package_tree[file] = pkg;
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
        return package_tree;
    }
    async collect(package_tree: any) {
        const packages = Config.get('packages');
        await Plugin.before('collect', packages);
        if (packages) {
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
                                package_tree[file] = pkg;
                            });
                        copySync(join(pkg.path, part), join(this.cwd, 'gen/raw'));
                    }
                });
            });
        }
        copySync('gen/raw', 'gen/src');
        // search for typescript files and compile them
        // const loader = require('ts-node').register({ /* options */ });

        // const ts_files = File.collect_files('gen/src', '.ts').map((file)=>{
        //     return file;
        // })
        // console.log(ts_files)

        // process.exit(1)
        await Plugin.after('collect', packages);
        return package_tree;
    }
    async routes(worker_controller: WorkerController, package_tree: any, file_list: any[], enhance_data: boolean = true, cron_state: any[] = null) {
        await Plugin.before('routes', file_list, enhance_data);
        let routes = Routes.collect_routes(null, package_tree);
        if (!routes || routes.length == 0) {
            return [file_list, null];
        }
        // add meta data to the route
        if (!enhance_data) {
            routes.forEach((route) => {
                route.initial = false;
            });
        }

        // rebuild only specific routes based on cron config
        if (cron_state && cron_state.length > 0) {
            const cron_paths = cron_state.map((state) => state.route);
            routes = routes
                .filter((route: Route) => {
                    return cron_paths.indexOf(route.rel_path) > -1;
                })
                .map((route) => {
                    route.cron = cron_state.find((state) => state.route == route.rel_path);
                    return route;
                });
        }
        // collect generated routes
        const route_urls = [];
        const on_route_index = worker_controller.events.on('emit', 'route', (data) => {
            // append the routes
            route_urls.push(...data.data);
        });

        const result = await worker_controller.process_in_workers(
            'routes',
            WorkerAction.route,
            routes.map((route) => ({
                route,
                add_to_global: !!enhance_data,
            })),
            1
        );
        worker_controller.events.off('emit', 'route', on_route_index);
        await Plugin.after('routes', file_list, enhance_data);
        // Logger.info('routes amount', routes_urls.length);
        // return [].concat(file_list, routes_urls);
        return [file_list, route_urls.length > 0 ? route_urls : null];
    }
    async transform() {
        const svelte_files = File.collect_svelte_files('gen/src');
        await Plugin.before('transform', svelte_files);

        // destroy getGlobal to avoid overlapping calls
        delete (<any>global).getGlobal;

        // combine svelte files
        svelte_files.map((file) => {
            const raw_content = readFileSync(file.path, { encoding: 'utf-8' });
            const [pre_error, preprocessed_content] = Client.preprocess_content(raw_content);
            if (pre_error) {
                Logger.error(pre_error);
            }
            const combined_content = Client.insert_splits(file.path, pre_error ? raw_content : preprocessed_content);
            try {
                const content = Global.replace_global(combined_content);
                writeFileSync(file.path, content);
            } catch (e) {
                Logger.error(Error.get(e, file.path, 'wyvr'));
            }
        });
        // search for hydrateable files
        const hydrateable_files = Client.get_hydrateable_svelte_files(svelte_files);

        // copy the hydrateable files into the gen/client folder
        Dir.clear('gen/client');
        // copy js/ts files to client, because stores and additional logic is "hidden" there
        Promise.all(
            File.collect_files('gen/src').map(async (file) => {
                if (file.match(/\.js/)) {
                    copySync(file, file.replace(/^gen\/src/, 'gen/client'));
                } else if (file.match(/\.ts/)) {
                    const ts_duration = process.hrtime();
                    const js_file = File.to_extension(file, '.js');
                    const swc = require('@swc/core');
                    const result = await swc.transform(readFileSync(file, { encoding: 'utf-8' }), {
                        // Some options cannot be specified in .swcrc
                        filename: js_file,
                        sourceMaps: true,
                        // Input files are treated as module by default.
                        isModule: true,

                        // All options below can be configured via .swcrc
                        jsc: {
                            parser: {
                                syntax: 'typescript',
                                dynamicImport: true,
                                decorators: true,
                            },
                            transform: {},
                            loose: true,
                            target: 'es2016',
                        },
                        module: {
                            type: 'commonjs',
                        },
                    });
                    // when swc returns a result, copy it to the client folder
                    const target_file = file.replace(/^gen\/src/, 'gen/client');
                    if (result) {
                        // for server side rendering
                        writeFileSync(js_file, result.code);
                        writeFileSync(`${js_file}.map`, result.map);
                        // for hydration
                        const js_target_file = File.to_extension(target_file, '.js');
                        writeFileSync(js_target_file, result.code);
                        writeFileSync(`${js_target_file}.map`, result.map);
                    }
                    copySync(file, target_file);
                    Logger.debug('compiled', file, 'to', js_file, 'in', hrtime_to_ms(process.hrtime(ts_duration)), 'ms');
                }
                return null;
            })
        );
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
    async build(
        worker_controller: WorkerController,
        list: string[],
        changed_files: { event: string; path: string; rel_path: string }[] = null,
        identifier_list: any[] = null
    ): Promise<[string[], string[]]> {
        mkdirSync('gen/src', { recursive: true });

        // rebuild ony affected resources
        if (
            changed_files &&
            changed_files.some((file) => file.rel_path.indexOf('src/') == 0) &&
            identifier_list &&
            identifier_list.length > 0 &&
            Dependency.cache
        ) {
            const deps = [];
            changed_files.forEach((file) => {
                deps.push(...Dependency.get_dependent_identifiers(file.rel_path));
            });
            // add the dependet identifiers to the variants which will be exposed as matrix
            const variants = { doc: ['*'], layout: ['*'], page: ['*'] };
            let ignore_default = true;
            deps.filter((val, index, arr) => {
                return arr.indexOf(val) == index;
            }).forEach((path) => {
                if (path.indexOf('Default.svelte') > -1) {
                    ignore_default = false;
                }
                if (path.indexOf('doc/') == 0) {
                    variants.doc.push(path.replace('doc/', ''));
                    return;
                }
                if (path.indexOf('layout/') == 0) {
                    variants.layout.push(path.replace('layout/', ''));
                    return;
                }
                if (path.indexOf('page/') == 0) {
                    variants.page.push(path.replace('page/', ''));
                    return;
                }
            });
            // build matrix of all possible combinations
            let dep_identifiers = [];
            variants.doc.forEach((doc) => {
                variants.layout.forEach((layout) => {
                    variants.page.forEach((page) => {
                        const di = Client.get_identifier_name(this.root_template_paths, doc, layout, page);
                        if (ignore_default && di == '*_*_*') {
                            return;
                        }
                        dep_identifiers.push(di.replace(/\*/g, '[^_]*'));
                    });
                });
            });
            // convert the dependecy identifiers to a valid regex
            dep_identifiers = dep_identifiers
                .map((val) => `^${val}$`)
                .filter((val, index, arr) => {
                    return arr.indexOf(val) == index;
                });
            // modify list that only affected pages gets rebuild
            const delete_files = [];
            list = identifier_list
                .filter((identifier_item) => {
                    return dep_identifiers.find((di_regex) => {
                        const matches = identifier_item.identifier.match(new RegExp(di_regex));
                        if (matches) {
                            delete_files.push(identifier_item.identifier);
                        }
                        return matches;
                    });
                })
                .map((identifier_item) => identifier_item.filename);
            // clear css files otherwise these will not be regenerated, because the build step only creates the file when it is not present already
            delete_files
                .filter((val, index, arr) => arr.indexOf(val) == index)
                .forEach((identifier) => {
                    removeSync(join('gen', 'css', `${identifier}.css`));
                });
        } else {
            // clear css files otherwise these will not be regenerated, because the build step only creates the file when it is not present already
            removeSync(join('gen', 'css'));
        }

        await Plugin.before('build', list);
        Logger.info('build datasets', list.length);
        const paths = [];
        const identifier_data_list = [];
        const on_build_index = worker_controller.events.on('emit', 'build', (data) => {
            // add the results to the build file list
            if (data) {
                paths.push(...data.data);
            }
        });
        const on_identifier_index = worker_controller.events.on('emit', 'identifier_list', (data) => {
            // add the results to the build file list
            if (data && data.data) {
                if (Array.isArray(data.data)) {
                    identifier_data_list.push(...data.data);
                    return;
                }
                identifier_data_list.push(data.data);
            }
        });

        const result = await worker_controller.process_in_workers('build', WorkerAction.build, list, 100);
        worker_controller.events.off('emit', 'build', on_build_index);
        worker_controller.events.off('emit', 'identifier_list', on_identifier_index);
        await Plugin.after('build', result, paths);
        return [paths, identifier_data_list];
    }
    async inject(list: string[]) {
        await Promise.all(
            list.map(async (file) => {
                // because of an compilation error the page can be non existing
                if (!file || !existsSync(file)) {
                    return null;
                }
                const content = readFileSync(file, { encoding: 'utf-8' });
                const head = [],
                    body = [];
                const [err_after, config, file_after, content_after, head_after, body_after] = await Plugin.after('inject', file, content, head, body);
                if (err_after) {
                    this.fail(err_after);
                }
                const injected_content = content_after
                    .replace(/<\/head>/, `${head_after.join('')}</head>`)
                    .replace(/<\/body>/, `${body_after.join('')}</body>`);
                writeFileSync(file, injected_content);
                return file;
            })
        );
    }
    async scripts(worker_controller: WorkerController, identifiers: any): Promise<boolean> {
        await Plugin.before('scripts', identifiers, Dependency.cache);
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

        const list = Object.keys(identifiers).map((key) => {
            return { file: identifiers[key], dependency: Dependency.cache };
        });
        const result = await worker_controller.process_in_workers('scripts', WorkerAction.scripts, list, 1);
        await Plugin.after('scripts', result);
        return result;
    }
    async optimize(identifier_list: any[], worker_controller: WorkerController) {
        if (Env.is_dev()) {
            Logger.improve('optimize will not be executed in dev mode');
            return;
        }
        await Plugin.before('optimize', identifier_list);
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
            this.fail(error_before);
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

        const result = await worker_controller.process_in_workers('optimize', WorkerAction.optimize, list, 1);

        const [error_after, config_after, list_after] = await Plugin.after('optimize', list);
        if (error_after) {
            this.fail(error_after);
        }
        return result;
    }
    async sitemap(release_path: string) {
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
            writeFileSync(join(release_path, file.name), JSON.stringify(file.entries, null, 4));
        });
        return files;
    }
    async plugins(release_path: string) {
        const plugin_files = File.collect_files(join('gen', 'plugins'));
        await Plugin.init(plugin_files, {
            release_path: release_path,
        });

        return null;
    }
    async link(uniq_id: string) {
        const [error_before] = await Plugin.before('link');
        if (error_before) {
            this.fail(error_before);
        }
        // symlink the "static" folders to release
        Link.to('gen/assets', `releases/${uniq_id}/assets`);
        Link.to('gen/js', `releases/${uniq_id}/js`);
        Link.to('gen/css', `releases/${uniq_id}/css`);

        const [error_after] = await Plugin.after('link');
        if (error_after) {
            this.fail(error_after);
        }
    }
    async release(uniq_id: string) {
        const [error_before] = await Plugin.before('release');
        if (error_before) {
            this.fail(error_before);
        }
        if (Env.is_prod()) {
            // in production copy the static folders
            ['assets', 'js', 'css'].forEach((folder) => {
                removeSync(`releases/${uniq_id}/${folder}`);
                copySync(`gen/${folder}`, `releases/${uniq_id}/${folder}`);
            });
        }
        const [error_after] = await Plugin.after('release');
        if (error_after) {
            this.fail(error_after);
        }
    }
    fail(error: any = null) {
        Logger.error('failed', error);
        process.exit(1);
    }
    cleanup_releases(mode: WyvrMode, keep: number = 0): boolean {
        if (mode == WyvrMode.build) {
            // delete old releases on new build
            Dir.create('releases');
            const deleted_releases = Publish.cleanup(keep);
            Logger.info(`keep ${keep} release(s), deleted ${deleted_releases.length}`);
            return true;
        }
        return false;
    }
    async publish(uniq_id: string) {
        Publish.release(uniq_id);
    }
}
