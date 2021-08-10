import { WorkerHelper } from '@lib/worker/helper';
import { WorkerStatus } from '@lib/model/worker/status';
import { WorkerAction } from '@lib/model/worker/action';
import { File } from '@lib/file';
import { Build } from '@lib/build';
import { Dir } from '@lib/dir';
import { join, dirname, resolve, sep } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs-extra';
import { LogType } from './model/log';
import { Client } from '@lib/client';
import { Routes } from '@lib/routes';
import { Config } from '@lib/config';
import { Generate } from '@lib/generate';
import { RequireCache } from '@lib/require_cache';
import { Error } from '@lib/error';
import { Optimize } from '@lib/optimize';
import { EnvModel } from './model/env';
import { Global } from './global';

export class Worker {
    private config = null;
    private env = null;
    private cwd = process.cwd();
    private root_template_paths = [join(this.cwd, 'gen', 'src', 'doc'), join(this.cwd, 'gen', 'src', 'layout'), join(this.cwd, 'gen', 'src', 'page')];
    private release_path = null;
    private identifiers_cache = {};
    constructor() {
        this.init();
    }
    async init() {
        process.title = `wyvr worker ${process.pid}`;

        WorkerHelper.send_status(WorkerStatus.exists);

        process.on('message', async (msg: any) => {
            const action = msg?.action?.key;
            const value = msg?.action?.value;
            if (!value) {
                WorkerHelper.log(LogType.warning, 'ignored message from main, no value given', msg);
                return;
            }
            switch (action) {
                case WorkerAction.configure:
                    // set the config of the worker by the main process
                    this.config = value?.config;
                    this.env = value?.env;
                    this.cwd = value?.cwd;
                    this.release_path = value?.release_path;
                    // only when everything is configured set the worker idle
                    if ((!this.config && this.env == null) || !this.cwd) {
                        WorkerHelper.log(LogType.warning, 'invalid configure value', value);
                        return;
                    }
                    WorkerHelper.send_status(WorkerStatus.done);
                    WorkerHelper.send_status(WorkerStatus.idle);
                    break;
                case WorkerAction.route:
                    WorkerHelper.send_status(WorkerStatus.busy);

                    const default_values = Config.get('default_values');
                    let global_data = {};
                    let route_data = [];
                    const route_result = await Promise.all(
                        value.map(async (entry) => {
                            const filename = entry.route.path;
                            const [error, route_result] = await Routes.execute_route(entry.route);
                            if (error) {
                                WorkerHelper.log(LogType.error, 'route error', Error.get(error, filename, 'route'));
                                return null;
                            }
                            const route_url = Routes.write_routes(route_result, (data: any) => {
                                // enhance the data from the pages
                                // set default values when the key is not available in the given data
                                data = Generate.set_default_values(Generate.enhance_data(data), default_values);
                                const result = this.emit_identifier(data);

                                if (!entry.add_to_global) {
                                    return data;
                                }
                                global_data = Generate.add_to_global(data, global_data);

                                
                                return result.data;
                            });
                            console.log('GLOBAL IN ROUTE', global_data)
                            await Global.merge_global_all(global_data);
                            route_data = [].concat(route_data, route_url);
                            return filename;
                        })
                    );
                    WorkerHelper.send_action(WorkerAction.emit, {
                        type: 'route',
                        data: route_data,
                    });
                    WorkerHelper.send_action(WorkerAction.emit, {
                        type: 'global',
                        data: global_data,
                    });
                    WorkerHelper.send_status(WorkerStatus.done);
                    WorkerHelper.send_status(WorkerStatus.idle);
                    break;
                case WorkerAction.build:
                    WorkerHelper.send_status(WorkerStatus.busy);
                    let identifier_list = [];
                    const build_result = await Promise.all(
                        value.map(async (filename) => {
                            const data = File.read_json(filename);
                            if (!data) {
                                WorkerHelper.log(LogType.error, 'broken/missing/empty file', filename);
                                return;
                            }
                            const result = this.emit_identifier(data);

                            const page_code = Build.get_page_code(result.data, result.doc, result.layout, result.page);
                            const [compile_error, compiled] = Build.compile(page_code);

                            if (compile_error) {
                                // svelte error messages
                                WorkerHelper.log(LogType.error, '[svelte]', data.url, Error.get(compile_error, filename, 'build'));
                                return;
                            }
                            const [render_error, rendered, identifier_item] = Build.render(compiled, data);
                            if (render_error) {
                                // svelte error messages
                                WorkerHelper.log(LogType.error, '[svelte]', data.url, Error.get(render_error, filename, 'render'));
                                return;
                            }
                            // change extension when set
                            const extension = data._wyvr?.extension;
                            const path = File.to_extension(filename.replace(join(this.cwd, 'gen', 'data'), this.release_path), extension);
                            // add debug data
                            if (extension.match(/html|htm|php/) && (this.env == EnvModel.debug || this.env == EnvModel.dev)) {
                                const data_path = File.to_extension(path, 'json');
                                rendered.result.html = rendered.result.html.replace(
                                    /<\/body>/,
                                    `<script>
                                    async function wyvr_fetch(path) {
                                        try {
                                            const response = await fetch(path);
                                            const data = await response.json();
                                            return data;
                                        } catch(e){
                                            console.error(e);
                                            return null;
                                        }
                                    }
                                    async function wyvr_debug_inspect_data() {
                                        window.data = await wyvr_fetch('${data_path.replace(this.release_path, '')}');
                                        console.log(window.data);
                                        console.info('now available inside "data"')
                                    }
                                    async function wyvr_debug_inspect_global_data() {
                                        window.global_data = await wyvr_fetch('/_global.json');
                                        console.log(window.global_data);
                                        console.info('now available inside "global_data"')
                                    }
                                    async function wyvr_debug_inspect_structure_data() {
                                        window.structure = await wyvr_fetch('/${data._wyvr?.identifier}.json');
                                        console.log(window.structure);
                                        console.info('now available inside "structure"')
                                    }
                                    </script></body>`
                                );
                                mkdirSync(dirname(data_path), { recursive: true });
                                writeFileSync(data_path, JSON.stringify(data));
                            }
                            if (identifier_item) {
                                identifier_item.path = path;
                                identifier_item.filename = filename;
                                identifier_list.push(identifier_item);
                            }

                            Dir.create(dirname(path));
                            writeFileSync(path, rendered.result.html);

                            return path;
                        })
                    );
                    // clear cache
                    this.identifiers_cache = {};
                    // bulk sending the css root elements
                    WorkerHelper.send_action(WorkerAction.emit, {
                        type: 'identifier_list',
                        data: identifier_list,
                    });
                    // bulk sending the build paths
                    WorkerHelper.send_action(WorkerAction.emit, {
                        type: 'build',
                        data: build_result,
                    });
                    // console.log('result', result);
                    WorkerHelper.send_status(WorkerStatus.done);
                    WorkerHelper.send_status(WorkerStatus.idle);
                    break;
                case WorkerAction.scripts:
                    WorkerHelper.send_status(WorkerStatus.busy);
                    const svelte_files = File.collect_svelte_files('gen/client');
                    // get all svelte components which should be hydrated
                    const files = Client.get_hydrateable_svelte_files(svelte_files);

                    await Promise.all(
                        value.map(async (identifier) => {
                            let dep_files = [];
                            ['doc', 'layout', 'page'].map((type) => {
                                if (identifier.file[type] && identifier.dependency[type] && identifier.dependency[type][identifier.file[type]]) {
                                    dep_files.push(
                                        ...identifier.dependency[type][identifier.file[type]]
                                            .map((path) => {
                                                const client_path = join('gen/client', path);
                                                const match = files.find((file) => file.path == client_path);
                                                return match;
                                            })
                                            .filter((x) => x)
                                    );
                                }
                            });
                            try {
                                const [error, result] = await Client.create_bundle(this.cwd, identifier.file, dep_files);
                            } catch (e) {
                                // svelte error messages
                                WorkerHelper.log(LogType.error, Error.get(e, identifier.file.name, 'worker scripts'));
                            }
                            return null;
                        })
                    );

                    WorkerHelper.send_status(WorkerStatus.done);
                    WorkerHelper.send_status(WorkerStatus.idle);
                    break;
                case WorkerAction.optimize:
                    if (value.length > 1) {
                        WorkerHelper.log(LogType.error, 'more then 1 entry in crititcal css extraction is not allowed');
                        return;
                    }
                    WorkerHelper.send_status(WorkerStatus.busy);
                    const critical = require('critical');
                    const minify = require('html-minifier').minify;
                    // create above the fold inline css
                    let { css } = await critical.generate({
                        inline: false, // generates CSS
                        base: this.release_path,
                        src: value[0].path,
                        dimensions: [
                            { width: 320, height: 568 },
                            { width: 360, height: 720 },
                            { width: 480, height: 800 },
                            { width: 1024, height: 768 },
                            { width: 1280, height: 1024 },
                            { width: 1920, height: 1080 },
                        ],
                    });
                    if (!css) {
                        css = '';
                    }

                    value[0].files.forEach((file) => {
                        const css_tag = `<style>${css}</style>`;
                        let content = readFileSync(file, { encoding: 'utf-8' }).replace(/<style data-critical-css><\/style>/, css_tag);
                        // replacve hashed files in the content
                        content = Optimize.replace_hashed_files(content, value[0].hash_list);
                        // minify the html output
                        try {
                            content = minify(content, {
                                collapseBooleanAttributes: true,
                                collapseInlineTagWhitespace: true,
                                collapseWhitespace: true,
                                continueOnParseError: true,
                                removeAttributeQuotes: true,
                                removeComments: true,
                                removeScriptTypeAttributes: true,
                                removeStyleLinkTypeAttributes: true,
                                useShortDoctype: true,
                            });
                        } catch (e) {
                            WorkerHelper.log(LogType.error, Error.get(e, file, 'worker optimize minify'));
                        }

                        writeFileSync(file, content);
                    });
                    WorkerHelper.send_status(WorkerStatus.done);
                    WorkerHelper.send_status(WorkerStatus.idle);
                    break;
                case WorkerAction.status:
                    WorkerHelper.log(LogType.debug, 'setting status from outside is not allowed');
                    break;
                case WorkerAction.cleanup:
                    WorkerHelper.log(LogType.debug, 'cleanup worker');
                    RequireCache.clear();
                    break;
                default:
                    WorkerHelper.log(LogType.warning, 'unknown message action from outside', msg);
                    break;
            }
        });

        process.on('uncaughtException', (err) => {
            WorkerHelper.log(LogType.error, 'uncaughtException', err.message, err.stack);
            process.exit(1);
        });
    }
    emit_identifier(data: any): any {
        const doc_file_name = File.find_file(join(this.cwd, 'gen', 'src', 'doc'), data._wyvr.template.doc);
        const layout_file_name = File.find_file(join(this.cwd, 'gen', 'src', 'layout'), data._wyvr.template.layout);
        const page_file_name = File.find_file(join(this.cwd, 'gen', 'src', 'page'), data._wyvr.template.page);

        const identifier = Client.get_identifier_name(this.root_template_paths, doc_file_name, layout_file_name, page_file_name);
        const result = {
            type: 'identifier',
            identifier,
            doc: doc_file_name,
            layout: layout_file_name,
            page: page_file_name,
        };
        // emit identifier only when it was not added to the cache
        if (!this.identifiers_cache[identifier]) {
            this.identifiers_cache[identifier] = true;
            WorkerHelper.send_action(WorkerAction.emit, result);
        }
        // add the identifier to the wyvr object
        data._wyvr.identifier = identifier;
        (<any>result).data = data;
        return result;
    }
}
