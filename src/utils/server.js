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
import { exec_request } from '../action/exec.js';

export function server(host, port, on_request, on_end) {
    if (!filled_string(host) || !is_number(port)) {
        Logger.warning('server could not be started because host or port is missing');
    }
    createServer((req, res) => {
        const start = process.hrtime.bigint();
        const uid = uniq_id();
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
    Logger.debug(req.method, Logger.color.bold(req.url), Logger.color.dim(uid));
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
    res.writeHead(status, { 'Content-Type': 'text/html' });
    res.end(message);
    return;
}
export function get_base_log_infos(start, uid) {
    const date = new Date();
    return [nano_to_milli(process.hrtime.bigint() - start) + Logger.color.dim('ms'), date.toLocaleTimeString(), Logger.color.dim(date.toLocaleDateString()), Logger.color.dim(uid)];
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
            const is_error = await on_end(err, req, res, uid);

            if (is_error && !res.writableEnded) {
                return return_not_found(req, res, uid, err.message, err.status, start);
            }
        }
        if (res.writableEnded) {
            log_end(req, uid, start);
        }
    });
}

export function app_server(host, port) {
    server(host, port, undefined, async (req, res, uid) => {
        await static_server(req, res, uid, async (err) => {
            if (err) {
                return await exec_request(req, res, uid, false);
            }
            return true;
        });
    });
}

export function watch_server(host, port, wsport, fallback) {
    server(host, port, undefined, async (req, res, uid) => {
        await static_server(req, res, uid, async (err) => {
            if (err) {
                const exec_result = await exec_request(req, res, uid, true);
                if (exec_result) {
                    return true;
                }
                if (!res.writableEnded && is_func(fallback)) {
                    await fallback(req, res, uid, err);
                }
                return false;
            }
            return true;
        });
    });
    websocket_server(wsport);
}
export function websocket_server(port) {
    const server = new WebSocketServer({ port });
    const watchers = {};

    server.on('connection', (ws) => {
        const id = uniq_id();
        ws.id = id;
        watchers[id] = undefined;
        Logger.debug('websocket connect', id);

        ws.on('close', () => {
            watchers[ws.id] = null;
            Logger.debug('websocket close', id);
        });
        ws.on('message', (message) => {
            let data = null;
            if (message) {
                try {
                    data = JSON.parse(message.toString('utf8'));
                } catch (e) {
                    Logger.warning(get_error_message(e, undefined, 'websocket'));
                }
            }
            Logger.info('ws data', data);
            // if (data.action) {
            //     switch (data.action) {
            //         case 'path':
            //             if (data.path) {
            //                 if (this.get_watched_files().indexOf(data.path) == -1) {
            //                     this.watchers[ws.id] = data.path;
            //                 }
            //             }
            //             break;
            //         case 'reload':
            //             if (data.path) {
            //                 Logger.block('rebuild', data.path);
            //                 this.rebuild();
            //             }
            //             break;
            //     }
            // }
        });
        // if (!watchers[ws.id]) {
        //     this.send(ws.id, { action: 'available' });
        // }
    });
}
