import { createServer } from 'http';
import { Logger } from './logger.js';
import { filled_string, is_func, is_number } from './validate.js';
import { uniq_id } from './uniq.js';
import static_server from 'node-static';
import { WebSocketServer } from 'ws';
import { Cwd } from '../vars/cwd.js';
import { get_error_message } from './error.js';

export function server(host, port, on_request, on_end) {
    if (!filled_string(host) || !is_number(port)) {
        Logger.warning('server could not be started because ');
    }
    createServer((req, res) => {
        const start = process.hrtime.bigint();
        const uid = uniq_id();
        if (is_func(on_request)) {
            on_request(req, uid, start);
        }

        req.addListener('end', async () => {
            if (is_func(on_end)) {
                return await on_end(req, res, uid, start);
            }
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(undefined);
        }).resume();
    }).listen(port, host, () => {
        Logger.success('server started', `http://${host}:${port}`);
    });
}

export function watch_server(host, port, wsport, fallback) {
    const pub = new static_server.Server(Cwd.get('pub'), {
        cache: false,
        serverInfo: `wyvr`,
    });
    server(host, port, undefined, async (req, res, uid) => {
        pub.serve(req, res, async (err) => {
            if (err) {
                if (is_func(fallback)) {
                    await fallback(req, res, uid, err);
                }
                if (!res.writableEnded) {
                    Logger.error(
                        'server',
                        req.method,
                        Logger.color.bold(req.url),
                        err.message,
                        Logger.color.dim(err.status)
                    );
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(undefined);
                }
            }
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
