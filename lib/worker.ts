/* eslint @typescript-eslint/no-explicit-any: 0 */

import { WorkerHelper } from '@lib/worker/helper';
import { WorkerStatus } from '@lib/model/worker/status';
import { WorkerAction } from '@lib/model/worker/action';
import { File } from '@lib/file';
import { join } from 'path';
import { Client } from '@lib/client';
import { RequireCache } from '@lib/require_cache';
import { WorkerEmit } from '@lib/model/worker/emit';
import { Logger } from '@lib/logger';
import { MediaModel } from '@lib/model/media';
import { Media } from '@lib/media';
import { Cwd } from '@lib/vars/cwd';
import { IWorkerSend } from '@lib/interface/worker';
import { configure } from '@lib/worker/configure';
import { route } from '@lib/worker/route';
import { build } from '@lib/worker/build';
import { script } from '@lib/worker/script';
import { optimize } from './worker/optimize';

export class Worker {
    private root_template_paths = null;
    private identifiers_cache = {};
    constructor() {
        this.init();
    }
    async init() {
        process.title = `wyvr worker ${process.pid}`;

        WorkerHelper.send_status(WorkerStatus.exists);

        process.on('message', async (msg: IWorkerSend) => {
            const action = msg?.action?.key;
            const value = msg?.action?.value;
            if (!value) {
                Logger.warning('ignored message from main, no value given', msg);
                return;
            }
            switch (action) {
                case WorkerAction.configure: {
                    // set the config of the worker by the main process
                    const config_result = configure(value);
                    if (config_result) {
                        this.root_template_paths = config_result.root_template_paths;
                    }
                    WorkerHelper.send_complete();
                    break;
                }
                case WorkerAction.route: {
                    WorkerHelper.send_status(WorkerStatus.busy);

                    const [global_data, route_data] = await route(value, (data: any) => this.emit_identifier(data));

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
                }
                case WorkerAction.build: {
                    WorkerHelper.send_status(WorkerStatus.busy);

                    const [identifier_list, build_result] = await build(value, (data: any) => this.emit_identifier(data));

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
                        data: build_result.filter((x) => x),
                    });
                    // console.log('result', result);
                    WorkerHelper.send_complete();
                    break;
                }
                case WorkerAction.scripts: {
                    WorkerHelper.send_status(WorkerStatus.busy);

                    await script(value);

                    WorkerHelper.send_complete();
                    break;
                }
                case WorkerAction.optimize: {
                    if (value.length > 1) {
                        Logger.error('more then 1 entry in crititcal css extraction is not allowed');
                        return;
                    }
                    WorkerHelper.send_status(WorkerStatus.busy);

                    await optimize(value[0]);

                    WorkerHelper.send_complete();
                    break;
                }
                case WorkerAction.media: {
                    WorkerHelper.send_status(WorkerStatus.busy);
                    await Promise.all(
                        value.map(async (media: MediaModel) => {
                            return await Media.process(media);
                        })
                    );
                    WorkerHelper.send_complete();
                    break;
                }
                case WorkerAction.status: {
                    Logger.debug('setting status from outside is not allowed');
                    break;
                }
                case WorkerAction.cleanup: {
                    Logger.debug('cleanup worker');
                    RequireCache.clear();
                    break;
                }
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
        const raw_path = join(Cwd.get(), 'gen', 'raw');
        const doc_file_name = File.find_file(join(raw_path, 'doc'), data._wyvr.template.doc);
        const layout_file_name = File.find_file(join(raw_path, 'layout'), data._wyvr.template.layout);
        const page_file_name = File.find_file(join(raw_path, 'page'), data._wyvr.template.page);

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
