import { WorkerHelper } from '@lib/worker/helper';
import { WorkerStatus } from '@lib/model/worker/status';
import { WorkerAction } from '@lib/model/worker/action';
import { File } from '@lib/file';
import { Build } from '@lib/build';
import { Dir } from '@lib/dir';
import { join, dirname, resolve } from 'path';
import * as fs from 'fs-extra';
import { LogType } from './model/log';
import { Client } from '@lib/client';
import { Routes } from '@lib/routes';
import { Config } from '@lib/config';
import { Generate } from '@lib/generate';

export class Worker {
    private config = null;
    private env = null;
    private cwd = process.cwd();
    private global_data: any = null;
    private root_template_paths = [join(this.cwd, 'gen', 'src', 'doc'), join(this.cwd, 'gen', 'src', 'layout'), join(this.cwd, 'gen', 'src', 'page')];
    constructor() {
        this.init();
    }
    async init() {
        process.title = `wyvr worker ${process.pid}`;

        WorkerHelper.send_status(WorkerStatus.exists);

        process.on('message', async (msg) => {
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
                    this.global_data = value?.global_data;
                    // only when everything is configured set the worker idle
                    if ((!this.config && this.env == null) || !this.cwd) {
                        WorkerHelper.log(LogType.warning, 'invalid configure value', value);
                        return;
                    }
                    WorkerHelper.send_status(WorkerStatus.idle);
                    break;
                case WorkerAction.route:
                    // if(!value || !value.routes) {
                    //     WorkerHelper.log(LogType.warning, 'missing routes', value);
                    //     return;
                    // }
                    WorkerHelper.send_status(WorkerStatus.busy);

                    const list = [];
                    const default_values = Config.get('default_values');
                    const route_result = await Promise.all(
                        value.map(async (entry) => {
                            const filename = entry.route;
                            // console.log(process.pid, '?', filename)
                            const route_result = await Routes.execute_route(filename);
                            const route_url = Routes.write_routes(route_result, (data: any) => {
                                // enhance the data from the pages
                                // set default values when the key is not available in the given data
                                data = Generate.set_default_values(Generate.enhance_data(data), default_values);

                                if (!entry.add_to_global) {
                                    return data;
                                }
                                const global_data = Generate.add_to_global(data, {});
                                WorkerHelper.send_action(WorkerAction.emit, {
                                    type: 'global',
                                    data: global_data,
                                });
                                return data;
                            });
                            Routes.remove_routes_from_cache();
                            list.push(filename);
                            return filename;
                        })
                    );
                    WorkerHelper.send_status(WorkerStatus.idle);
                    break;
                case WorkerAction.build:
                    WorkerHelper.send_status(WorkerStatus.busy);
                    const build_result = await Promise.all(
                        value.map(async (filename) => {
                            const data = File.read_json(filename);
                            if (!data) {
                                WorkerHelper.log(LogType.error, 'broken/missing/empty file', filename);
                                return;
                            }
                            const doc_file_name = File.find_file(join(this.cwd, 'gen', 'src', 'doc'), data._wyvr.template.doc);
                            const layout_file_name = File.find_file(join(this.cwd, 'gen', 'src', 'layout'), data._wyvr.template.layout);
                            const page_file_name = File.find_file(join(this.cwd, 'gen', 'src', 'page'), data._wyvr.template.page);

                            const entrypoint = Client.get_entrypoint_name(this.root_template_paths, doc_file_name, layout_file_name, page_file_name);
                            // add the entrypoint to the wyvr object
                            data._wyvr.entrypoint = entrypoint;
                            WorkerHelper.send_action(WorkerAction.emit, {
                                type: 'entrypoint',
                                entrypoint,
                                doc: doc_file_name,
                                layout: layout_file_name,
                                page: page_file_name,
                            });

                            const page_code = Build.get_page_code(data, doc_file_name, layout_file_name, page_file_name);
                            const compiled = Build.compile(page_code);

                            if (compiled.error) {
                                // svelte error messages
                                WorkerHelper.log(LogType.error, '[svelte]', filename, compiled);
                                return;
                            }
                            const rendered = Build.render(compiled, data);

                            const path = File.to_extension(filename.replace(join(this.cwd, 'imported', 'data'), 'pub'), 'html');

                            Dir.create(dirname(path));
                            fs.writeFileSync(path, rendered.result.html);

                            return filename;
                        })
                    );

                    // console.log('result', result);
                    WorkerHelper.send_status(WorkerStatus.idle);
                    break;
                case WorkerAction.scripts:
                    WorkerHelper.send_status(WorkerStatus.busy);
                    const svelte_files = Client.collect_svelte_files('gen/client');
                    // @todo get all svelte components which should be hydrated
                    const files = Client.get_hydrateable_svelte_files(svelte_files);

                    // @todo bundle them together
                    try {
                        await Client.create_bundles(this.cwd, value, files);
                    } catch (e) {
                        // svelte error messages
                        WorkerHelper.log(LogType.error, '[svelte]', e);
                    }

                    WorkerHelper.send_status(WorkerStatus.idle);
                    break;
                case WorkerAction.status:
                    WorkerHelper.log(LogType.debug, 'setting status from outside is not allowed');
                    break;
                case WorkerAction.cleanup:
                    WorkerHelper.log(LogType.debug, 'cleanup worker');
                    Build.remove_svelte_files_from_cache();
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
}
