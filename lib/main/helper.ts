import { readFileSync, writeFileSync, existsSync, copySync, mkdirSync, removeSync } from 'fs-extra';
import { dirname, join, sep, extname, basename } from 'path';

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
import { Build } from '@lib/build';
import { EnvModel } from '@lib/model/env';
import { Transform } from '@lib/transform';
import { WyvrFileLoading } from '@lib/model/wyvr/file';
import { I18N } from '@lib/i18n';
import { Media } from '@lib/media';
import replaceAsync from 'string-replace-async';

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
                package_json = File.read_json('package.json');
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
    async i18n() {
        const packages = Config.get('packages');
        const result = I18N.collect(packages);
        I18N.write(result);
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
        // replace global in all files
        const all_files = File.collect_files('gen/raw');
        // @NOTE: plugin is only allowed to change the content of the files itself, no editing of the list
        await Plugin.before('transform', all_files);
        // destroy getGlobal to avoid overlapping calls
        delete (<any>global).getGlobal;

        await Promise.all(
            all_files.map(async (file) => {
                let content = File.read(file);
                if (file.match(/\.svelte$/)) {
                    // combine svelte files
                    content = Transform.insert_splits(file, content);
                    // convert other formats, scss, ...
                    const [pre_error, preprocessed_content] = Transform.preprocess_content(content);
                    if (pre_error) {
                        Logger.error(pre_error);
                    }
                    // replace the css imports
                    content = Transform.insert_css_imports(pre_error ? content : preprocessed_content, file);
                }

                try {
                    const result_content = await Global.replace_global(content);
                    File.write(file, result_content);
                } catch (e) {
                    Logger.error(Error.get(e, file, 'wyvr'));
                }
                return null;
            })
        );

        // destroy the client folder to avoid old versions
        Dir.clear('gen/client');
        // copy js/ts files to client, because stores and additional logic is "hidden" there
        await Promise.all(
            all_files.map(async (raw_path) => {
                const extension = extname(raw_path);
                let src_path = raw_path.replace(/^gen\/raw/, 'gen/src');
                // prepare for the client
                let client_path = raw_path.replace(/^gen\/raw/, 'gen/client');
                mkdirSync(dirname(client_path), { recursive: true });
                // replace wyvr values/imports
                const content = File.read(raw_path);
                let server_content = Build.correct_import_paths(Transform.replace_wyvr_imports(content, false), extension);
                let client_content = Client.correct_import_paths(Client.remove_on_server(Transform.replace_wyvr_imports(content, true)), extension);
                let write_files = true;

                switch (extension) {
                    case '.svelte':
                        client_content = Client.replace_slots_client(client_content);
                        break;
                    case '.ts':
                        const ts_duration = process.hrtime();
                        // server file
                        await Transform.typescript_compile(src_path, server_content);
                        // client file
                        await Transform.typescript_compile(client_path, client_content);
                        Logger.debug('compiled', src_path, 'in', hrtime_to_ms(process.hrtime(ts_duration)), 'ms');
                        write_files = false;
                        break;
                    case '.js':
                    default:
                        break;
                }
                if (write_files) {
                    File.write(src_path, server_content);
                    File.write(client_path, client_content);
                }
                return null;
            })
        );

        const svelte_files = File.collect_svelte_files('gen/src');
        const hydrateable_files = Client.get_hydrateable_svelte_files(svelte_files);
        // validate hydratable files
        hydrateable_files.map((file) => {
            if (file.config?.loading == WyvrFileLoading.none && !file.config?.trigger) {
                Logger.error(Logger.color.dim('[wyvr]'), file.rel_path, 'trigger prop is required, when loading is set to none');
            }
            if (file.config?.loading == WyvrFileLoading.media && !file.config?.media) {
                Logger.error(Logger.color.dim('[wyvr]'), file.rel_path, 'media prop is required, when loading is set to media');
            }
        });
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
        watched_json_files: string[] = [],
        changed_files: { event: string; path: string; rel_path: string }[] = null,
        identifier_list: any[] = null
    ) {
        // match exactly against the json files
        const filtered_list = list.filter((entry) => {
            return watched_json_files.find((file) => entry == file);
        });
        // build only the matching datasets
        const [pages, identifier_data_list] = await this.build_list(worker_controller, filtered_list);
        return [pages, identifier_data_list];
    }
    async inject(list: string[], socket_port: number = 0, release_path: string = ''): Promise<[any, any]> {
        const [err_before, config_before, list_before] = await Plugin.before('inject', list);
        if (err_before) {
            this.fail(err_before);
            return [{}, null];
        }
        const shortcode_identifiers = {};
        const media = {};
        let has_media = false;
        await Promise.all(
            list_before.map(async (file) => {
                // because of an compilation error the page can be non existing
                if (!file || !existsSync(file)) {
                    return null;
                }
                const content = File.read(file);
                const head = [],
                    body = [];
                // inject dev socket connection
                if (Env.is_dev()) {
                    body.push(
                        `<script id="wyvr_client_socket">${Client.transform_resource(
                            File.read(join(__dirname, '..', 'resource', 'client_socket.js')).replace(/\{port\}/g, socket_port)
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

                // @INFO media before shortcode replacement
                // replace media
                const media_content = await replaceAsync(injected_content, /\(media\(([\s\S]*?)\)\)/g, async (match_media, inner) => {
                    const config = await Media.get_config(inner);
                    // store for later transformation
                    has_media = true;
                    media[config.result] = config;
                    return config.result;
                });

                if (!shortcode_imports) {
                    writeFileSync(file, media_content);
                    return file;
                }

                const imports = Object.keys(shortcode_imports)
                    .map((name) => {
                        return `import ${name} from '${shortcode_imports[name]}';`;
                    })
                    .join('\n');
                const svelte_code = `<script>${imports}</script>${media_content}`;
                writeFileSync(file.replace('.html', '.svelte'), svelte_code);

                const [compile_error, compiled] = await Build.compile(svelte_code);

                if (compile_error) {
                    // svelte error messages
                    Logger.error('[svelte]', file, Error.get(compile_error, file, 'build shortcodes'));
                    writeFileSync(file, media_content);
                    return file;
                }
                const [render_error, rendered, identifier_item] = await Build.render(compiled, { _wyvr: { identifier: file.replace(release_path + sep, '') } });
                if (render_error) {
                    // svelte error messages
                    Logger.error('[svelte]', file, Error.get(render_error, file, 'render shortcodes'));
                    writeFileSync(file, media_content);
                    return file;
                }

                // @INFO media after shortcode replacement
                // replace media
                rendered.result.html = await replaceAsync(rendered.result.html, /\(media\(([\s\S]*?)\)\)/g, async (match_media, inner) => {
                    const config = await Media.get_config(inner);
                    // store for later transformation
                    has_media = true;
                    media[config.result] = config;
                    return config.result;
                });

                shortcode_identifiers[identifier_item.identifier] = {
                    name: identifier_item.identifier,
                    shortcodes: Object.values(shortcode_imports).map((path: string) => path.replace(src_path + sep, '')),
                };

                const css_identifier = `/${join('css', identifier_item.identifier.replace(/\./g, '-'))}.css`;
                const js_identifier = `/${join('js', identifier_item.identifier.replace(/\./g, '-'))}.js`;

                writeFileSync(
                    file,
                    rendered.result.html
                        .replace(
                            /<\/head>/,
                            `<link rel="preload" href="${css_identifier}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${css_identifier}"></noscript></head>`
                        )
                        .replace(/<\/body>/, `<script src="${js_identifier}"></script></body>`)
                );

                return file;
            })
        );
        return [shortcode_identifiers, has_media ? media : null];
    }
    async scripts(worker_controller: WorkerController, identifiers: any, is_watching: boolean = false): Promise<boolean> {
        await Plugin.before('scripts', identifiers, Dependency.cache);

        if (is_watching) {
            // remove only new identifier files
            Object.keys(identifiers).forEach((identifier) => removeSync(join('gen', 'js', `${identifier}.js`)));
        } else {
            Dir.clear('gen/js');
        }

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
    async media(worker_controller: WorkerController, media: any): Promise<boolean> {
        await Plugin.before('media', media);

        const list = Object.values(media);
        const result = await worker_controller.process_in_workers('media', WorkerAction.media, list, 100);
        await Plugin.after('media', result);
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
            env: EnvModel[Env.get()],
        });
        // allow plugins to modify the global config
        let global = Config.get(null);
        const [error_before, config_before, global_before] = await Plugin.before('global', global);
        if (error_before) {
            this.fail(error_before);
        }
        if (global_before != null) {
            global = global_before;
        }
        const [error_after, config_after, global_after] = await Plugin.after('global', global);
        if (error_after) {
            this.fail(error_after);
        }
        if (global_after != null) {
            global = global_after;
        }
        await Global.set('global', global);

        return null;
    }
    async link(uniq_id: string) {
        const [error_before] = await Plugin.before('link');
        if (error_before) {
            this.fail(error_before);
        }
        const static_folders = ['assets', 'js', 'css', 'i18n'];
        // symlink the "static" folders to release
        static_folders.forEach((folder) => {
            Link.to(`gen/${folder}`, `releases/${uniq_id}/${folder}`);
        });

        // link media cache
        Link.to(`cache/media`, `releases/${uniq_id}/media`);

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
        Publish.release(uniq_id);
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
}
