import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { is_func } from '../utils/validate.js';
import { WorkerController } from '../worker/controller.js';
import { base_action } from './base_action.js';

export async function worker_action(name, action, batch_size, get_data_fn) {
    if(!is_func(get_data_fn)) {
        Logger.error('missing or wrong get data function to receive data for the workers');
        return;
    }
    await base_action(name, async ()=> {
        const data = await get_data_fn();

        await Plugin.before(name, data);

        await WorkerController.process_in_workers(action, data, batch_size);

        await Plugin.after(name, data);
    });
}
