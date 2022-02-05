import { WorkerHelper } from '@lib/worker/helper';
import { WorkerStatus } from '@lib/struc/worker/status';
import { WorkerAction } from '@lib/struc/worker/action';

import { WorkerEmit } from '@lib/struc/worker/emit';
import { Logger } from '@lib/logger';
import { MediaModel } from '@lib/model/media';
import { Media } from '@lib/media';
import { route } from '@lib/worker/route';
import { build } from '@lib/worker/build';
import { script } from '@lib/worker/script';
import { inject } from '@lib/worker/inject';
import { optimize } from '@lib/worker/optimize';
import { create_data_result } from '@lib/worker/create_data_result';
import { transform } from '@lib/worker/transform';

/* eslint-disable @typescript-eslint/no-explicit-any */
export class WorkerActionExecutor {
    constructor(private root_template_paths: string[], private socket_port: number = undefined) {}
    private identifiers_cache = {};

    async execute(action: WorkerAction, value: any) {
        WorkerHelper.send_status(WorkerStatus.busy);
        switch (action) {
            case WorkerAction.route: {
                const [nav_data, route_data] = await route(value, (data: any) => this.emit_identifier(data));

                WorkerHelper.send_action(WorkerAction.emit, {
                    type: WorkerEmit.route,
                    data: route_data,
                });
                // @Note: must be fired for every route to determin when routes are completed
                WorkerHelper.send_action(WorkerAction.emit, {
                    type: WorkerEmit.navigation,
                    data: nav_data,
                });
                break;
            }
            case WorkerAction.transform: {
                await transform(value);

                break;
            }
            case WorkerAction.build: {
                const [identifier_list, build_result] = await build(value, (data: any) => this.emit_identifier(data));

                // clear cache
                this.identifiers_cache = {};
                // bulk sending the css root elements
                WorkerHelper.send_action(WorkerAction.emit, {
                    type: WorkerEmit.identifier_list,
                    data: identifier_list,
                });
                // bulk sending the build paths
                WorkerHelper.send_action(WorkerAction.emit, {
                    type: WorkerEmit.build,
                    data: build_result.filter((x) => x),
                });
                // console.log('result', result);
                break;
            }
            case WorkerAction.inject: {
                Logger.warning('inject value', value);
                const { media, shortcode_identifiers } = await inject(value, this.socket_port);
                if (Object.keys(shortcode_identifiers).length > 0) {
                    WorkerHelper.send_action(WorkerAction.emit, {
                        type: WorkerEmit.inject_shortcode_identifier,
                        data: shortcode_identifiers,
                    });
                }
                if (media) {
                    WorkerHelper.send_action(WorkerAction.emit, {
                        type: WorkerEmit.inject_media,
                        data: media,
                    });
                }

                break;
            }
            case WorkerAction.scripts: {
                await script(value);
                break;
            }
            case WorkerAction.optimize: {
                if (value.length > 1) {
                    Logger.error('more then 1 entry in crititcal css extraction is not allowed');
                    break;
                }
                WorkerHelper.send_status(WorkerStatus.busy);

                await optimize(value[0]);
                break;
            }
            case WorkerAction.media: {
                await Promise.all(
                    value.map(async (media: MediaModel) => {
                        return await Media.process(media);
                    })
                );
                break;
            }
        }
        WorkerHelper.send_complete();
    }

    emit_identifier(data: any) {
        const result = create_data_result(data, this.root_template_paths, (wyvr_data, result, identifier) => {
            // emit identifier only when it was not added to the cache
            // or avoid when the given data has to be static => no JS
            if (!this.identifiers_cache[identifier] && !wyvr_data.static) {
                this.identifiers_cache[identifier] = true;
                WorkerHelper.send_action(WorkerAction.emit, result);
            }
        });

        return result;
    }
}
/* eslint-enable */
