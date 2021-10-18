import { WorkerHelper } from '@lib/worker/helper';
import { WorkerStatus } from '@lib/model/worker/status';
import { WorkerAction } from '@lib/model/worker/action';
import { File } from '@lib/file';
import { Build } from '@lib/build';
import { Dir } from '@lib/dir';
import { join, dirname, extname } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs-extra';
import { LogType } from '@lib/model/log';
import { Client } from '@lib/client';
import { Routes } from '@lib/routes';
import { Config } from '@lib/config';
import { Generate } from '@lib/generate';
import { RequireCache } from '@lib/require_cache';
import { Error } from '@lib/error';
import { Optimize } from '@lib/optimize';
import { EnvModel } from '@lib/model/env';
import { WorkerEmit } from '@lib/model/worker/emit';
import { Dependency } from '@lib/dependency';
import { WyvrFile } from '@lib/model/wyvr/file';
import { Env } from '@lib/env';
import { Logger } from '@lib/logger';
import { MediaModel } from '@lib/model/media';
import sharp from 'sharp';

export class Worker {
    private config = null;
    private env = null;
    private cwd = process.cwd();
    private root_template_paths = [join(this.cwd, 'gen', 'raw', 'doc'), join(this.cwd, 'gen', 'raw', 'layout'), join(this.cwd, 'gen', 'raw', 'page')];
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
                Logger.warning('ignored message from main, no value given', msg);
                return;
            }
            switch (action) {
                case WorkerAction.configure:
                    // set the config of the worker by the main process
                    this.config = value?.config;
                    this.env = value?.env;
                    Env.set(this.env);
                    this.cwd = value?.cwd;
                    this.release_path = value?.release_path;
                    // only when everything is configured set the worker idle
                    if ((!this.config && this.env == null) || !this.cwd) {
                        Logger.warning('invalid configure value', value);
                        return;
                    }
                    WorkerHelper.send_complete();
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
                                Logger.error('route error', Error.get(error, filename, 'route'));
                                return null;
                            }
                            const route_url = Routes.write_routes(route_result, (data: any) => {
                                // enhance the data from the pages
                                // set default values when the key is not available in the given data
                                const enhanced_data = Generate.set_default_values(Generate.enhance_data(data), default_values);
                                const result = this.emit_identifier(enhanced_data);

                                if (!entry.add_to_global) {
                                    return result.data;
                                }
                                global_data = Generate.add_to_global(enhanced_data, global_data);

                                return result.data;
                            });
                            route_data = [].concat(route_data, route_url);
                            return filename;
                        })
                    );
                    WorkerHelper.send_action(WorkerAction.emit, {
                        type: WorkerEmit.route,
                        data: route_data,
                    });
                    WorkerHelper.send_action(WorkerAction.emit, {
                        type: WorkerEmit.global,
                        data: global_data,
                    });
                    WorkerHelper.send_complete();
                    break;
                case WorkerAction.build:
                    WorkerHelper.send_status(WorkerStatus.busy);
                    let identifier_list = [];
                    const build_result = await Promise.all(
                        value.map(async (filename) => {
                            const data = File.read_json(filename);
                            if (!data) {
                                Logger.error('broken/missing/empty file', filename);
                                return;
                            }
                            const result = this.emit_identifier(data);

                            const page_code = Build.get_page_code(result.data, result.doc, result.layout, result.page);
                            const [compile_error, compiled] = await Build.compile(page_code);

                            if (compile_error) {
                                // svelte error messages
                                Logger.error('[svelte]', data.url, Error.get(compile_error, filename, 'build'));
                                return;
                            }
                            const [render_error, rendered, identifier_item] = await Build.render(compiled, data);
                            if (render_error) {
                                // svelte error messages
                                Logger.error('[svelte]', data.url, Error.get(render_error, filename, 'render'));
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

                            // remove svelte integrated comment from compiler to avoid broken output
                            if (!extension.match(/html|htm|php/)) {
                                rendered.result.html = rendered.result.html.replace(/<!-- HTML_TAG_(?:START|END) -->/g, '');
                            }
                            writeFileSync(path, rendered.result.html);

                            return { path, filename, doc: result.doc, layout: result.layout, page: result.page, identifier: result.identifier, _wyvr: data._wyvr };
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
                    WorkerHelper.send_complete();
                    break;
                case WorkerAction.scripts:
                    WorkerHelper.send_status(WorkerStatus.busy);
                    const svelte_files = File.collect_svelte_files('gen/client');
                    // get all svelte components which should be hydrated
                    const files = Client.get_hydrateable_svelte_files(svelte_files);

                    await Promise.all(
                        value.map(async (identifier) => {
                            let dep_files = [];
                            ['doc', 'layout', 'page'].forEach((type) => {
                                if (identifier.file[type]) {
                                    dep_files.push(...Dependency.get_dependencies(identifier.file[type], files, identifier.dependency));
                                }
                            });
                            if (identifier.file.shortcodes) {
                                dep_files.push(...Dependency.get_dependencies(identifier.file.name, files, identifier.dependency));
                            }
                            // remove doubled dependency entries
                            dep_files = dep_files.filter((wyvr_file: WyvrFile, index) => {
                                return index == dep_files.findIndex((dep_file: WyvrFile) => dep_file.path == wyvr_file.path);
                            });
                            try {
                                // console.log(identifier.file.name, identifier.dependency, dep_files);
                                const [error, result] = await Client.create_bundle(this.cwd, identifier.file, dep_files);
                            } catch (e) {
                                // svelte error messages
                                Logger.error(Error.get(e, identifier.file.name, 'worker scripts'));
                            }
                            return null;
                        })
                    );

                    WorkerHelper.send_complete();
                    break;
                case WorkerAction.optimize:
                    if (value.length > 1) {
                        Logger.error('more then 1 entry in crititcal css extraction is not allowed');
                        return;
                    }
                    WorkerHelper.send_status(WorkerStatus.busy);
                    const critical = require('critical');
                    let css = null;
                    try {
                        // create above the fold inline css
                        const result = await critical.generate({
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
                        css = result.css;
                    } catch (e) {
                        Logger.error(Error.get(e, value[0].files[0], 'worker optimize critical'));
                    }
                    if (!css) {
                        css = '';
                    }

                    const minify = require('html-minifier').minify;
                    value[0].files.forEach((file) => {
                        const css_tag = `<style>${css}</style>`;
                        let content = readFileSync(file, { encoding: 'utf-8' }).replace(/<style data-critical-css><\/style>/, css_tag);
                        // replacve hashed files in the content
                        content = Optimize.replace_hashed_files(content, value[0].hash_list);
                        // minify the html output
                        if (['.html', '.htm'].indexOf(extname(file)) > -1) {
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
                                Logger.error(Error.get(e, file, 'worker optimize minify'));
                            }
                        }

                        writeFileSync(file, content);
                    });
                    WorkerHelper.send_complete();
                    break;
                case WorkerAction.media:
                    WorkerHelper.send_status(WorkerStatus.busy);
                    await Promise.all(
                        value.map(async (media: MediaModel) => {
                            const output = MediaModel.get_output(media.result);
                            const exists = File.is_file(output);
                            // create only when not already exists
                            if (exists) {
                                return null;
                            }
                            const buffer = await MediaModel.get_buffer(media.src);
                            if(!buffer) {
                                Logger.error('@media', `input file "${media.src}" doesn't exist`);
                                return null;
                            }
                            Dir.create(dirname(output));
                            const options: any = { fit: media.mode, position: 'centre' };
                            if (media.width != null && media.width > -1) {
                                options.width = media.width;
                            }
                            if (media.height != null && media.height > -1) {
                                options.height = media.height;
                            }
                            try {
                                Logger.info(media.src, options);
                                const result = await sharp(buffer).resize(options).toFile(output);
                            } catch (e) {
                                Logger.error(Error.get(e, media.src, 'sharp'));
                            }
                            return null;
                        })
                    );
                    WorkerHelper.send_complete();
                    break;
                case WorkerAction.status:
                    Logger.debug('setting status from outside is not allowed');
                    break;
                case WorkerAction.cleanup:
                    Logger.debug('cleanup worker');
                    RequireCache.clear();
                    break;
                default:
                    Logger.warning('unknown message action from outside', msg);
                    break;
            }
        });

        process.on('uncaughtException', (err) => {
            Logger.error('uncaughtException', err.message, err.stack);
            process.exit(1);
        });
    }
    emit_identifier(data: any): any {
        const doc_file_name = File.find_file(join(this.cwd, 'gen', 'raw', 'doc'), data._wyvr.template.doc);
        const layout_file_name = File.find_file(join(this.cwd, 'gen', 'raw', 'layout'), data._wyvr.template.layout);
        const page_file_name = File.find_file(join(this.cwd, 'gen', 'raw', 'page'), data._wyvr.template.page);

        const identifier = Client.get_identifier_name(this.root_template_paths, doc_file_name, layout_file_name, page_file_name);
        const result = {
            type: 'identifier',
            identifier,
            doc: doc_file_name,
            layout: layout_file_name,
            page: page_file_name,
        };
        // emit identifier only when it was not added to the cache
        // or avoid when the given data has to be static => no JS
        if (!this.identifiers_cache[identifier] && !data._wyvr.static) {
            this.identifiers_cache[identifier] = true;
            WorkerHelper.send_action(WorkerAction.emit, result);
        }
        // add the identifier to the wyvr object
        data._wyvr.identifier = identifier;
        (<any>result).data = data;

        // correct doc, layout and page from raw to src
        result.doc = result.doc.replace(/gen\/raw/, 'gen/src');
        result.layout = result.layout.replace(/gen\/raw/, 'gen/src');
        result.page = result.page.replace(/gen\/raw/, 'gen/src');
        return result;
    }
}
