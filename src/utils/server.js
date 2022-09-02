import { createServer } from 'http';
import { Logger } from './logger.js';
import { filled_string, is_func, is_number } from './validate.js';
import { uniq_id } from './uniq.js';
import NodeStatic from 'node-static';
import { WebSocketServer } from 'ws';
import { Cwd } from '../vars/cwd.js';
import { get_error_message } from './error.js';
import { nano_to_milli } from './convert.js';
import { Env } from '../vars/env.js';
import { exec_request, fallback_exec_request } from '../action/exec.js';
import { config_from_url } from './media.js';
import { media } from '../action/media.js';
import { Event } from './event.js';
import { stringify } from './json.js';
import { LogType } from '../struc/log.js';
import { watcher_event } from './watcher.js';
import { WatcherPaths } from '../vars/watcher_paths.js';

export function server(host, port, on_request, on_end) {
    if (!filled_string(host) || !is_number(port)) {
        Logger.warning('server could not be started because host or port is missing');
    }
    createServer((req, res) => {
        const start = process.hrtime.bigint();
        const uid = uniq_id();
        if (Env.is_dev()) {
            res.setHeader('Wyvr-Uid', uid);
        }
        if (is_func(on_request)) {
            on_request(req, res, uid, start);
        }

        req.addListener('end', async () => {
            if (is_func(on_end)) {
                return await on_end(req, res, uid, start);
            }
            return return_not_found(req, res, uid, 'Not found', 404, start);
        }).resume();
    }).listen(port, host, () => {
        const pre_text = 'server started at';
        const text = `http://${host}:${port}`;
        const filler = new Array(2 + pre_text.length + 1 + text.length).fill('─').join('');
        Logger.output(undefined, undefined, Logger.color.dim(filler));
        Logger.success(pre_text, text);
        Logger.output(undefined, undefined, Logger.color.dim(filler));
        Logger.output(undefined, undefined, Logger.color.dim('...'));
    });
}

export function log_start(req, uid) {
    const date = new Date();
    Logger.debug(
        req.method,
        Logger.color.bold(req.url),
        date.toLocaleTimeString(),
        Logger.color.dim(date.toLocaleDateString()),
        Logger.color.dim(uid)
    );
    return process.hrtime.bigint();
}
export function log_end(req, uid, start) {
    Logger.success(req.method, Logger.color.bold(req.url), ...get_base_log_infos(start, uid));
}
export function return_not_found(req, res, uid, message, status, start) {
    Logger.error(
        req.method,
        Logger.color.bold(req.url),
        message,
        Logger.color.dim(status),
        ...get_base_log_infos(start, uid)
    );
    send_head(res, status, 'text/html');
    send_content(res, message);
    return;
}
export function get_base_log_infos(start, uid) {
    const date = new Date();
    return [
        nano_to_milli(process.hrtime.bigint() - start) + Logger.color.dim('ms'),
        date.toLocaleTimeString(),
        Logger.color.dim(date.toLocaleDateString()),
        Logger.color.dim(uid),
    ];
}

export function send_head(res, status, content_type) {
    if (!res.headersSent) {
        const headers = {};
        if (content_type) {
            headers['Content-Type'] = content_type;
        }
        res.writeHead(status, headers);
        return true;
    }
    return false;
}
export function send_content(res, content) {
    if (!res.writableEnded) {
        res.end(content);
        return true;
    }
    return false;
}

let static_server_instance;
export function static_server(req, res, uid, on_end) {
    const cache = Env.is_prod() ? 3600 : false;
    const start = log_start(req, uid);

    if (!static_server_instance) {
        static_server_instance = new NodeStatic.Server(Cwd.get('pub'), {
            cache,
            serverInfo: `wyvr`,
        });
    }
    static_server_instance.serve(req, res, async (err) => {
        if (is_func(on_end)) {
            await on_end(err, req, res, uid);

            if (!res.writableEnded) {
                return return_not_found(req, res, uid, err.message, err.status, start);
            }
        }
        if (res.writableEnded) {
            log_end(req, uid, start);
        }
    });
}

export function app_server(host, port) {
    generate_server(host, port, false, undefined, undefined);
}

export function watch_server(host, port, wsport, fallback) {
    Logger.emit = true;
    generate_server(
        host,
        port,
        true,
        () => {
            Logger.info('onEnd');
        },
        fallback
    );
    websocket_server(wsport);
}

async function generate_server(host, port, force_generating_of_resources, onEnd, fallback) {
    server(host, port, undefined, async (req, res, uid) => {
        // check for media files
        const media_config = config_from_url(req.url);
        if (media_config && !media_config.result_exists) {
            // generate media on demand
            await media([media_config]);
        }
        await static_server(req, res, uid, async (err) => {
            if (err) {
                const exec_result = await exec_request(req, res, uid, force_generating_of_resources);
                if (exec_result) {
                    return;
                }
                if (!res.writableEnded) {
                    if (is_func(fallback)) {
                        await fallback(req, res, uid, err);
                        return false;
                    }
                    const fallback_result = await fallback_exec_request(req, res, uid);
                    if (fallback_result) {
                        return;
                    }
                }
                return false;
            }
            return true;
        });
    });
}

export function websocket_server(port) {
    const server = new WebSocketServer({ port });
    const watchers = {};

    function send_all_watchers(data) {
        Object.keys(watchers).forEach((key) => {
            if (watchers[key]) {
                Logger.debug('ws send', key, data);
                watchers[key].send(stringify(data));
            }
        });
    }
    let avoid_reload = false;
    Event.on('client', 'reload', (data) => {
        if (!avoid_reload) {
            send_all_watchers({ action: 'reload', data });
        }
        avoid_reload = false;
    });
    Event.on('logger', LogType.error, (data) => {
        send_all_watchers({ action: 'error', data });
        avoid_reload = true;
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
                    Logger.warning(get_error_message(e, undefined, 'websocket'));
                }
            }
            Logger.info('ws data', data);
            if (data.action) {
                switch (data.action) {
                    case 'path': {
                        WatcherPaths.set_path(id, data.data);
                        break;
                    }
                    case 'rebuild': {
                        if (data.data) {
                            Logger.block('rebuild', data.data);
                            watcher_event('change', data.data);
                        }
                        break;
                    }
                }
            }
        });
        ws.send(stringify({ action: 'available' }));
    });
}
