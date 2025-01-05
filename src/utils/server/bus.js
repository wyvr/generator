import { Logger } from './../logger.js';
import { Cwd } from '../../vars/cwd.js';
import { Event } from './../event.js';
import { stringify } from './../json.js';
import { LogType } from '../../struc/log.js';
import { watcher_event } from './../watcher.js';
import { WatcherPaths } from '../../vars/watcher_paths.js';
import { copy, exists, remove } from './../file.js';
import { join } from 'node:path';
import { get_route } from './../routes.js';
import { STORAGE_PACKAGE_TREE } from '../../constants/storage.js';
import { KeyValue } from '../database/key_value.js';
import { Config } from '../config.js';
import { filled_array } from '../validate.js';

const queue = [];
const pkgs = [];
export function init_bus(packages) {
    if (filled_array(packages)) {
        pkgs.push(...packages);
        Object.freeze(pkgs);
    }
    Event.on('client', 'reload', (data) => {
        add_message({ reload: data });
    });
    Event.on('logger', LogType.error, (data) => {
        add_message({ error: data });
    });
    Event.on('logger', LogType.warning, (data) => {
        add_message({ warning: data });
    });
}

export function add_message(message) {
    queue.push(message);
}

export function process_bus(req, res) {
    const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, max-age=0',
        Pragma: 'no-cache'
    };
    res.writeHead(200, undefined, headers);
    // create not linked copy of the queue
    const result = queue.slice(0);
    // clear queue
    queue.length = 0;
    // process the messages
    if (Array.isArray(req.body) && req.body.length > 0) {
        for (const data of req.body) {
            const message_result = process_bus_message(data);
            if (Array.isArray(message_result) && message_result.length > 0) {
                result.push(...message_result);
            }
        }
    }
    res.end(stringify(result));
    return;
}

// process messages from the client side
function process_bus_message(data) {
    if (!data?.type) {
        return;
    }
    switch (data.type) {
        case 'path': {
            WatcherPaths.set_path(id, data.path);
            break;
        }
        case 'rebuild': {
            if (data.path) {
                let path;
                Logger.block('rebuild', data.path);
                // check if the url is a route
                const route = get_route(data.path, 'get', Config.get('route.cache'));
                if (route) {
                    const found_route = pkgs.map((pkg) => join(pkg.path, route.rel_path)).find((file) => exists(file));
                    if (found_route) {
                        path = found_route;
                    }
                }
                if (path) {
                    watcher_event('change', path);
                }
            }
            break;
        }
        case 'config': {
            return [{
                config: Config.get()
            }];
        }
        case 'package_tree': {
            const package_tree_db = new KeyValue(STORAGE_PACKAGE_TREE);
            return [{
                package_tree: package_tree_db.all()
            }];
        }
        case 'file_system': {
            const cwd = Cwd.get();
            if (data?.action === 'delete' && data?.path) {
                if (!data?.path.startsWith(cwd)) {
                    return;
                }
                remove(data.path);
                return;
            }
            if (data?.action === 'copy' && data?.path && data?.to) {
                if (!data?.path.startsWith(cwd) || !data.to.startsWith(cwd)) {
                    return;
                }
                copy(data.path, data.to);
                return;
            }
            break;
        }
    }
}