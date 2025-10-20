import { KeyValue } from '../utils/database/key_value.js';
import { STORAGE_COLLECTION, STORAGE_OPTIMIZE_CRITICAL } from '../constants/storage.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Event } from '../utils/event.js';
import { to_index } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { Env } from '../vars/env.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';
import { PLUGIN_CRITICAL } from '../constants/plugins.js';

export async function critical() {
    // generate critical is only available in production mode
    if (Env.is_dev()) {
        return;
    }
    const name = 'critical';
    const critical_name = get_name(WorkerEmit.critical);
    const critical = {};

    await measure_action(name, async () => {
        const collection_db = new KeyValue(STORAGE_COLLECTION);

        const identifier_files = collection_db.get('identifier_files');
        const data = [];
        for (const identifier of Object.keys(identifier_files)) {
            const files = identifier_files[identifier].map((file) => to_index(file));
            const file = files.find((file) => file.match(/\.html?$/));
            if (file) {
                data.push({ identifier, file });
            }
            critical[identifier] = {
                css: '',
                files
            };
        }

        const critical_id = Event.on('emit', critical_name, (data) => {
            if (!data) {
                return;
            }
            for (const key of Object.keys(data.critical)) {
                critical[key].css = data.critical[key];
            }
        });

        // wrap in plugin
        const caller = await Plugin.process(PLUGIN_CRITICAL, data);
        await caller(async (data) => {
            await WorkerController.process_in_workers(WorkerAction.critical, data, 1);
            return critical;
        });

        Event.off('emit', critical_name, critical_id);

        // persist the result
        const critical_db = new KeyValue(STORAGE_OPTIMIZE_CRITICAL);
        critical_db.setObject(critical);
        critical_db.close();
    });
    return critical;
}
