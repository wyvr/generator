import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Event } from '../utils/event.js';
import { to_index } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { Storage } from '../utils/storage.js';
import { Env } from '../vars/env.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function critical() {
    // generate critical is only available in production mode
    if (Env.is_dev()) {
        return;
    }
    const name = 'critical';
    const critical_name = get_name(WorkerEmit.critical);
    const critical = {};

    await measure_action(name, async () => {
        const identifier_files = await Storage.get('collection', 'identifier_files');
        const data = [];
        Object.keys(identifier_files).forEach((identifier) => {
            const files = identifier_files[identifier].map((file) => to_index(file));
            const file = files.find((file) => file.match(/\.html?$/));
            if (file) {
                data.push({ identifier, file });
            }
            critical[identifier] = {
                css: '',
                files,
            };
        });

        const critical_id = Event.on('emit', critical_name, (data) => {
            if (!data) {
                return;
            }
            Object.keys(data.critical).forEach((key) => {
                critical[key].css = data.critical[key];
            });
        });

        // wrap in plugin
        const caller = await Plugin.process(name, data);
        await caller(async (data) => {
            await WorkerController.process_in_workers(WorkerAction.critical, data, 1);
        });

        Event.off('emit', critical_name, critical_id);
    });
    return critical;
}
