/* eslint @typescript-eslint/no-explicit-any: 0 */

import { WorkerHelper } from '@lib/worker/helper';
import { WorkerStatus } from '@lib/struc/worker/status';
import { WorkerAction } from '@lib/struc/worker/action';

import { RequireCache } from '@lib/require_cache';
import { Logger } from '@lib/logger';
import { IWorkerSend } from '@lib/interface/worker';
import { configure } from '@lib/worker/configure';
import { WorkerActionExecutor } from '@lib/worker/executor';

export class Worker {
    private executor: WorkerActionExecutor = undefined;
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
                        this.executor = new WorkerActionExecutor(config_result.root_template_paths, config_result.socket_port);
                    }
                    WorkerHelper.send_complete();
                    break;
                }
                case WorkerAction.route:
                case WorkerAction.transform:
                case WorkerAction.build:
                case WorkerAction.inject:
                case WorkerAction.scripts:
                case WorkerAction.optimize:
                case WorkerAction.media: {
                    if (!value) {
                        Logger.warning('ignored message from main, no value given', msg);
                        return;
                    }
                    await this.executor.execute(action, value);
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
}
