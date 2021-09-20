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
import { hrtime_to_ms } from '@lib/converter/time';
import { WorkerEmit } from '@lib/model/worker/emit';
import { Build } from '../build';

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
    async routes(
        worker_controller: WorkerController,
        package_tree: any,
        changed_files: any[],
        enhance_data: boolean = true,
        cron_state: any[] = null
    ): Promise<[any[], any[], number]> {
        await Plugin.before('routes', changed_files, enhance_data);
        let routes = Routes.collect_routes(null, package_tree);
        // shrink routes to only modified ones
        if (changed_files.length > 0) {
            const rel_paths = changed_files.map((file) => file.rel_path);
            routes = routes.filter((route) => {
                return rel_paths.indexOf(route.rel_path) > -1;
            });
        }
        if (!routes || routes.length == 0) {
            return [changed_files, null, 0];
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
        const on_route_index = worker_controller.events.on('emit', WorkerEmit.route, (data) => {
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
        worker_controller.events.off('emit', WorkerEmit.route, on_route_index);
        await Plugin.after('routes', changed_files, enhance_data);
        // Logger.info('routes amount', routes_urls.length);
        // return [].concat(file_list, routes_urls);
        const cron_routes = route_urls.length > 0 ? route_urls : null;
        return [route_urls, cron_routes, routes.length];
    }
    async transform() {
        const svelte_files = File.collect_svelte_files('gen/src');
        await Plugin.before('transform', svelte_files);

        // destroy getGlobal to avoid overlapping calls
        delete (<any>global).getGlobal;

        // combine svelte files
        await Promise.all(
            svelte_files.map(async (file) => {
                const raw_content = readFileSync(file.path, { encoding: 'utf-8' });
                const [pre_error, preprocessed_content] = Client.preprocess_content(raw_content);
                if (pre_error) {
                    Logger.error(pre_error);
                }
                const combined_content = Client.insert_splits(file.path, pre_error ? raw_content : preprocessed_content);
                try {
                    const content = await Global.replace_global(combined_content);
                    writeFileSync(file.path, content);
                } catch (e) {
                    Logger.error(Error.get(e, file.path, 'wyvr'));
                }
                return null;
            })
        );
        // search for hydrateable files
        const hydrateable_files = Client.get_hydrateable_svelte_files(svelte_files);

        // copy the hydrateable files into the gen/client folder
        Dir.clear('gen/client');
        // copy js/ts files to client, because stores and additional logic is "hidden" there
        await Promise.all(
            File.collect_files('gen/src').map(async (file) => {
                if (file.match(/\.js/)) {
                    const target_file = file.replace(/^gen\/src/, 'gen/client');
                    // copySync(file, file.replace(/^gen\/src/, 'gen/client'));
                    // also replace paths in the js/ts files
                    File.create_dir(target_file);
                    const content = readFileSync(file, { encoding: 'utf-8' });
                    writeFileSync(file, Client.correct_import_paths(content));
                    writeFileSync(target_file, Client.correct_import_paths(content));
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
    async build_list(worker_controller: WorkerController, list: string[]) {
        Logger.debug('build list', list);
        const [error_list, config, modified_list] = await Plugin.before('build', list);
        Logger.debug('build', modified_list.length, `${modified_list.length == 1 ? 'dataset' : 'datasets'}`);
        const pages = [];
        const identifier_data_list = [];
        const on_build_index = worker_controller.events.on('emit', WorkerEmit.build, (data) => {
            // add the results to the build file list
            if (data) {
                // console.log('build result', data.data);
                pages.push(...data.data.filter((x) => x));
            }
        });
        const on_identifier_index = worker_controller.events.on('emit', WorkerEmit.identifier_list, (data) => {
            // add the results to the build file list
            if (data && data.data) {
                // console.log('emit identifier_list', data.data);
                if (Array.isArray(data.data)) {
                    identifier_data_list.push(...data.data);
                    return;
                }
                identifier_data_list.push(data.data);
            }
        });

        const result = await worker_controller.process_in_workers('build', WorkerAction.build, modified_list, 100);
        worker_controller.events.off('emit', WorkerEmit.build, on_build_index);
        worker_controller.events.off('emit', WorkerEmit.identifier_list, on_identifier_index);
        await Plugin.after('build', result, pages);
        return [pages, identifier_data_list];
    }
    async build_files(
        worker_controller: WorkerController,
        list: string[],
        watched_files: string[] = [],
        changed_files: { event: string; path: string; rel_path: string }[] = null,
        identifier_list: any[] = null
    ) {
        // build the json files
        const watched_json_files = watched_files.map((path) => File.to_index(join(process.cwd(), 'gen', 'data', path), 'json'));
        // match exactly against the json files
        const filtered_list = list.filter((entry) => {
            return watched_json_files.find((file) => entry == file);
        });
        // build only the matching datasets
        const [pages, identifier_data_list] = await this.build_list(worker_controller, filtered_list);
        return [pages, identifier_data_list];
    }
    async inject(list: string[], socket_port: number = 0, release_path: string = '') {
        const [err_before, config_before, list_before] = await Plugin.before('inject', list);
        if (err_before) {
            this.fail(err_before);
            return {};
        }
        const shortcode_identifiers = {};
        await Promise.all(
            list_before.map(async (file) => {
                // because of an compilation error the page can be non existing
                if (!file || !existsSync(file)) {
                    return null;
                }
                const content = readFileSync(file, { encoding: 'utf-8' });
                const head = [],
                    body = [];
                // inject dev socket connection
                if (Env.is_dev()) {
                    body.push(
                        `<script id="wyvr_client_socket">${Client.transform_resource(
                            readFileSync(join(__dirname, '..', 'resource', 'client_socket.js'), { encoding: 'utf-8' }).replace(/\{port\}/g, socket_port)
                        )}</script>`
                    );
                }
                // @INFO shortcodes
                // replace shortcodes
                let shortcode_imports = null;
                const src_path = join(this.cwd, 'gen', 'src');
                const replaced_content = content.replace(/\(\(([\s\S]*?)\)\)/g, (match_shortcode, inner) => {
                    const match = inner.match(/([^ ]*)([\s\S]*)/);
                    let name = null;
                    let path = null;
                    let value = null;
                    if (match) {
                        value = match[1];
                    } else {
                        // ignore when something went wrong
                        if (Env.is_dev()) {
                            Logger.warning('shortcode can not be replaced in', file, match);
                        }
                        return match;
                    }
                    // check wheter the path was given or the name
                    if (value.indexOf('/') > -1) {
                        name = value.replace(/\//g, '_');
                        path = `${src_path}/${value}.svelte`;
                    } else {
                        name = value;
                        path = `${src_path}/${value.replace(/_/g, '/')}.svelte`;
                    }
                    name = name.replace(/_(.)/g, (m, $1) => $1.toUpperCase()).replace(/^(.)/g, (m, $1) => $1.toUpperCase());
                    if (!shortcode_imports) {
                        shortcode_imports = {};
                    }
                    shortcode_imports[name] = path;
                    const data = match[2];
                    const props = {};
                    const data_length = data.length;
                    let parentese = 0;
                    let prop_name = '';
                    let prop_value = '';
                    for (let i = 0; i < data_length; i++) {
                        const char = data[i];
                        if (char == '{') {
                            parentese++;
                            if (parentese == 1) {
                                continue;
                            }
                        }
                        if (char == '}') {
                            parentese--;
                            if (parentese == 0) {
                                try {
                                    const prop_exec = `JSON.stringify(${prop_value})`;
                                    prop_value = eval(prop_exec);
                                } catch (e) {
                                    Logger.debug('shortcode props can not be converted in', file, 'for', prop_name.trim());
                                }
                                props[prop_name.trim()] = prop_value.replace(/\n\s*/gm, ''); //.replace(/"/g, '&quot;');
                                prop_name = '';
                                prop_value = '';
                                continue;
                            }
                        }
                        if (char != '=' && parentese == 0) {
                            prop_name += char;
                        }
                        if (parentese > 0) {
                            prop_value += char;
                        }
                    }
                    const props_component = Object.keys(props)
                        .map((key) => {
                            return `${key}={${props[key]}}`;
                        })
                        .join(' ');

                    return `<${name} ${props_component} />`;
                });

                const [err_after, config_after, file_after, content_after, head_after, body_after] = await Plugin.after('inject', file, replaced_content, head, body);
                if (err_after) {
                    this.fail(err_after);
                }
                const injected_content = content_after.replace(/<\/head>/, `${head_after.join('')}</head>`).replace(/<\/body>/, `${body_after.join('')}</body>`);

                if (!shortcode_imports) {
                    writeFileSync(file, injected_content);
                    return file;
                }

                const imports = Object.keys(shortcode_imports)
                    .map((name) => {
                        return `import ${name} from '${shortcode_imports[name]}';`;
                    })
                    .join('\n');
                const svelte_code = `<script>${imports}</script>${injected_content}`;
                writeFileSync(file.replace('.html', '.svelte'), svelte_code);

                const [compile_error, compiled] = await Build.compile(svelte_code);

                if (compile_error) {
                    // svelte error messages
                    Logger.error('[svelte]', file, Error.get(compile_error, file, 'build shortcodes'));
                    writeFileSync(file, injected_content);
                    return file;
                }
                const [render_error, rendered, identifier_item] = await Build.render(compiled, { _wyvr: { identifier: file.replace(release_path + sep, '') } });
                if (render_error) {
                    // svelte error messages
                    Logger.error('[svelte]', file, Error.get(render_error, file, 'render shortcodes'));
                    writeFileSync(file, injected_content);
                    return file;
                }

                shortcode_identifiers[identifier_item.identifier] = {
                    name: identifier_item.identifier,
                    shortcodes: Object.values(shortcode_imports).map((path: string) => path.replace(src_path + sep, '')),
                };

                writeFileSync(
                    file,
                    rendered.result.html.replace(
                        /<\/head>/,
                        `<link rel="preload" href="/${join(
                            'css',
                            identifier_item.identifier
                        )}.css" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${join(
                            'css',
                            identifier_item.identifier
                        )}"></noscript></head>`
                    ).replace(/<\/body>/, `<script src="/${join(
                        'js',
                        identifier_item.identifier
                    )}.js"></script></body>`)
                );

                return file;
            })
        );
        return shortcode_identifiers;
    }
    async scripts(worker_controller: WorkerController, identifiers: any, is_watching: boolean = false): Promise<boolean> {
        await Plugin.before('scripts', identifiers, Dependency.cache);
        if (is_watching) {
            // remove only new identifier files
            Object.keys(identifiers).forEach((identifier) => removeSync(join('gen', 'js', `${identifier}.js`)));
        } else {
            Dir.clear('gen/js');
        }

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
                            writeFileSync(path, Client.remove_on_server(Client.replace_slots_client(readFileSync(join(this.cwd, 'gen', 'src', dep_file), { encoding: 'utf-8' }))));
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

        const [error_before, config_before, identifier_list_before, replace_hash_files_before] = await Plugin.before('optimize', identifier_list, replace_hash_files);
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
    async sitemap(release_path: string, pages: any[]) {
        const [before_error, before_config, before_sitemaps] = await Plugin.before('sitemap', [
            {
                name: 'sitemap.xml',
                sitemaps: ['page-sitemap.xml'],
            },
            {
                name: 'page-sitemap.xml',
                entries: pages,
            },
        ]);
        if (before_error) {
            Logger.error(before_error);
            this.fail();
        }
        const url = `${Config.get('https') ? 'https://' : 'http://'}${Config.get('url')}`;
        const size = 10000;
        // split when there are to many entries
        const splitted_sitemaps = [];
        const replace_sitemaps = {};
        const sitemaps = before_sitemaps
            .map((sitemap) => {
                if (sitemap.entries) {
                    sitemap.entries = sitemap.entries
                        .filter((entry) => {
                            // remove private pages from the sitemap
                            return entry._wyvr.private !== true;
                        })
                        .sort((a, b) => {
                            return b._wyvr.priority - a._wyvr.priority || a.path.localeCompare(b.path);
                        });
                    if (sitemap.entries.length > size) {
                        const amount = Math.ceil(sitemap.entries.length / size);
                        for (let i = 0; i < amount; i++) {
                            const clone = {
                                name: sitemap.name.replace(/\.xml/, `-${i + 1}.xml`),
                                entries: [],
                            };
                            if (!replace_sitemaps[sitemap.name]) {
                                replace_sitemaps[sitemap.name] = [];
                            }
                            replace_sitemaps[sitemap.name].push(clone.name);
                            clone.entries = sitemap.entries.slice(i * size, (i + 1) * size);
                            splitted_sitemaps.push(clone);
                        }
                        return null;
                    }
                }
                return sitemap;
            })
            .filter((x) => x)
            .map((sitemap) => {
                if (sitemap.sitemaps) {
                    const append_sitemap = [];
                    const mod_sitemap = sitemap.sitemaps.filter((entry) => {
                        if (replace_sitemaps[entry]) {
                            append_sitemap.push(...replace_sitemaps[entry]);
                            return false;
                        }
                        return entry;
                    });
                    sitemap.sitemaps = mod_sitemap.concat(append_sitemap);
                }
                return sitemap;
            });
        const combined_sitemap = sitemaps.concat(splitted_sitemaps);
        const [after_error, after_config, after_sitemaps] = await Plugin.after('sitemap', combined_sitemap);
        if (after_error) {
            Logger.error(before_error);
            this.fail();
        }
        // build sitemap files
        after_sitemaps.forEach((sitemap) => {
            if (!sitemap || !sitemap.name) {
                Logger.error('sitemap is incorrect', JSON.stringify(sitemap));
                return;
            }

            const content = ['<?xml version="1.0" encoding="UTF-8"?>'];
            if (sitemap.sitemaps) {
                content.push('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
                content.push(
                    sitemap.sitemaps
                        .map((entry) => {
                            return `<url>
                <loc>${url}/${entry}</loc>
             </url>`;
                        })
                        .join('')
                );
                content.push('</sitemapindex>');
            }
            if (sitemap.entries) {
                content.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
                content.push(
                    sitemap.entries
                        .map((entry) => {
                            return `<url>
                <loc>${url}${File.remove_index(entry.path.replace(release_path, ''))}</loc>
                ${entry._wyvr.last_modified ? `<lastmod>${entry._wyvr.last_modified}</lastmod>` : ''}
                ${entry._wyvr.change_frequence ? `<changefreq>${entry._wyvr.change_frequence}</changefreq>` : ''}
                ${entry._wyvr.priority ? `<priority>${entry._wyvr.priority}</priority>` : ''}
             </url>`;
                        })
                        .join('')
                );
                content.push('</urlset>');
            }

            writeFileSync(join(release_path, sitemap.name), content.join('').replace(/^\s+/gm, '').replace(/\n|\r/g, ''));
        });
        return;
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
