import { Logger } from './../logger.js';
import { uniq_id } from './../uniq.js';
import { WebSocketServer } from 'ws';
import { Cwd } from '../../vars/cwd.js';
import { get_error_message } from './../error.js';
import { Event } from './../event.js';
import { stringify } from './../json.js';
import { LogType } from '../../struc/log.js';
import { watcher_event } from './../watcher.js';
import { WatcherPaths } from '../../vars/watcher_paths.js';
import { copy, exists, remove } from './../file.js';
import { join } from 'node:path';
import { get_route } from './../routes.js';
import { get_config_cache } from './../config_cache.js';

export function websocket_server(port, packages) {
    const server = new WebSocketServer({ port });
    const watchers = {};

    function send_all_watchers(data) {
        for (const key of Object.keys(watchers)) {
            const watcher = watchers[key];
            if (watcher) {
                Logger.debug('ws send', key, data);
                watcher.send(stringify(data));
            }
        }
    }
    Event.on('client', 'reload', (data) => {
        send_all_watchers({ action: 'reload', data });
    });
    Event.on('logger', LogType.error, (data) => {
        send_all_watchers({ action: 'error', data });
    });

    server.on('connection', (ws) => {
        const id = uniq_id();
        ws.id = id;
        watchers[id] = ws;
        Logger.debug('websocket connect', id);

        ws.on('close', () => {
            WatcherPaths.set_path(id, undefined);
            watchers[ws.id] = null;
            Logger.debug('websocket close', id);
        });
        ws.on('message', async (message) => {
            let data = null;
            if (message) {
                try {
                    data = JSON.parse(message.toString('utf8'));
                } catch (e) {
                    Logger.warning(
                        get_error_message(e, undefined, 'websocket')
                    );
                }
            }
            Logger.debug('client message', data);
            if (data.action) {
                switch (data.action) {
                    case 'path': {
                        WatcherPaths.set_path(id, data.data);
                        break;
                    }
                    case 'rebuild': {
                        if (data.data) {
                            let path;
                            Logger.block('rebuild', data.data);
                            // check if the url is a route
                            const route = get_route(
                                data.data,
                                'get',
                                get_config_cache('route.cache')
                            );
                            if (route) {
                                const found_route = packages
                                    .map((pkg) =>
                                        join(pkg.path, route.rel_path)
                                    )
                                    .find((file) => exists(file));
                                if (found_route) {
                                    path = found_route;
                                }
                            }
                            if (!path) {
                                path = data.data;
                            }
                            watcher_event('change', path);
                        }
                        break;
                    }
                    case 'get_config_cache': {
                        if (typeof data.data === 'string') {
                            ws.send(
                                stringify({
                                    action: 'get_config_cache',
                                    data: {
                                        key: data.data,
                                        value: get_config_cache(data.data),
                                    },
                                })
                            );
                        }
                        break;
                    }
                    case 'file_system': {
                        const cwd = Cwd.get();
                        if (data.data?.action === 'delete' && data.data?.path) {
                            if (!data.data?.path.startsWith(cwd)) {
                                return;
                            }
                            remove(data.data.path);
                            return;
                        }
                        if (
                            data.data?.action === 'copy' &&
                            data.data?.path &&
                            data.data?.to
                        ) {
                            if (
                                !data.data?.path.startsWith(cwd) ||
                                !data.data.to.startsWith(cwd)
                            ) {
                                return;
                            }
                            copy(data.data.path, data.data.to);
                            return;
                        }
                        break;
                    }
                }
            }
        });
        ws.send(stringify({ action: 'available' }));
    });
}
