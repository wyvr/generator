import { createServer } from 'http';
import { Logger } from './logger.js';
import { filled_string, is_func, is_number } from './validate.js';
import { uniq_id } from './uniq.js';
import static_server from 'node-static';
import { WebSocketServer } from 'ws';
import { Cwd } from '../vars/cwd.js';
import { get_error_message } from './error.js';
import { get_exec, run_exec } from './exec.js';
import { FOLDER_CSS, FOLDER_GEN_JS, FOLDER_JS } from '../constants/folder.js';
import { copy, exists, write } from './file.js';
import { split_css_into_media_query_files } from './css.js';
import { ReleasePath } from '../vars/release_path.js';
import { join } from 'path';
import { scripts } from '../worker_action/scripts.js';

export function server(host, port, on_request, on_end) {
    if (!filled_string(host) || !is_number(port)) {
        Logger.warning('server could not be started because host or port is missing');
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
                const exec = get_exec(req.url);
                if (exec) {
                    const result = await run_exec(req, res, uid, exec);
                    // write css
                    if (filled_string(result?.data?._wyvr?.identifier) && result?.result?.css?.code) {
                        const css_file_path = join(ReleasePath.get(), FOLDER_CSS, `${result.data._wyvr.identifier}.css`);
                        //if (!exists(css_file_path)) {
                            write(css_file_path, result.result.css.code);
                        //}
                    }
                    const js_path = join(ReleasePath.get(), FOLDER_JS, `${result.data._wyvr.identifier}.js`);
                    if(result?.data?._wyvr?.identifier_data) {
                        const identifiers = [result?.data?._wyvr?.identifier_data];
                        // save the file to gen
                        await scripts(identifiers);
                        copy(Cwd.get(FOLDER_GEN_JS, `${result.data._wyvr.identifier}.js`), js_path);
                    }
                    if(result?.result?.html) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(result.result.html); 
                    }
                }
                if (!res.writableEnded && is_func(fallback)) {
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
                    res.end('the resource could not be found');
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
