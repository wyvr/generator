import { FOLDER_CACHE } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { IsWorker } from '../vars/is_worker.js';
import { WorkerController } from '../worker/controller.js';
import { Config } from './config.js';
import { read_json, write_json } from './file.js';
import { filled_string, is_null } from './validate.js';

export function get_config_cache(segment, fallback_value) {
    if (!filled_string(segment)) {
        return fallback_value;
    }
    let value = Config.get(segment);
    if (!is_null(value)) {
        return value;
    }
    if (!IsWorker.get()) {
        const path = get_config_cache_path(segment);
        const cache = read_json(path);
        if (is_null(cache)) {
            return fallback_value;
        }
        Config.set(segment, cache);
    }
    return Config.get(segment, fallback_value);
}

export function set_config_cache(segment, value, send_to_workers = true) {
    if (!filled_string(segment)) {
        return;
    }
    Config.set(segment, value);
    // is main
    if (!IsWorker.get()) {
        const path = get_config_cache_path(segment);
        write_json(path, value);
        if (send_to_workers) {
            WorkerController.set_config_cache_all_workers(segment, value);
        }
    }
}

export function get_config_cache_path(segment) {
    if (!filled_string(segment)) {
        return undefined;
    }
    const main = segment.replace(/\./g, '_');
    return Cwd.get(FOLDER_CACHE, `${main}.json`);
}
