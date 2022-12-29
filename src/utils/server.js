import { createServer } from 'http';
import formidable from 'formidable';
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
import { config_from_url, get_buffer } from './media.js';
import { Event } from './event.js';
import { stringify } from './json.js';
import { LogType } from '../struc/log.js';
import { watcher_event } from './watcher.js';
import { wait_for } from './wait.js';
import { WatcherPaths } from '../vars/watcher_paths.js';
import { exists } from './file.js';
import { WorkerController } from '../worker/controller.js';
import { WorkerAction } from '../struc/worker_action.js';
import { tmpdir } from 'os';
import { extname } from 'path';

let show_all_requests = true;

export function server(host, port, on_request, on_end) {
    if (!filled_string(host) || !is_number(port)) {
        Logger.warning('server could not be started because host or port is missing');
    }
    createServer(async (req, res) => {
        const start = process.hrtime.bigint();
        const uid = uniq_id();
        if (Env.is_dev()) {
            res.setHeader('Wyvr-Uid', uid);
        }
        // force redirect to urls with / at the end
        const url = req.url;
        let clean_url = url.replace(/\?.*/, '').replace(/#.*/, '');
        const question_mark = url.indexOf('?');
        const hash = url.indexOf('#');
        if (!extname(clean_url) && clean_url[clean_url.length - 1] != '/') {
            const params_pos = Math.min(question_mark > -1 ? question_mark : Number.MAX_SAFE_INTEGER, hash > -1 ? hash : Number.MAX_SAFE_INTEGER);
            res.writeHead(Env.is_dev() ? 302 : 301, {
                location: clean_url+'/'+url.substring(params_pos),
            });
            res.end();
            return;
        }
        if (is_func(on_request)) {
            on_request(req, res, uid, start);
        }
        const files = {};
        const data = {};
        const query = {};
        // add query parameters to the request
        if (question_mark > -1) {
            const params = new URLSearchParams(url.substring(question_mark + 1));
            Array.from(params.keys()).forEach((key) => {
                query[key] = params.get(key);
            });
        }

        req.query = query;
        // stop without parsing the body when not post, patch, put
        if (!is_data_method(req.method)) {
            req.data = data;
            req.files = files;
            return await final(on_end, req, res, uid, start);
        }
        // allow sending files
        const form = formidable({ keepExtensions: true, uploadDir: tmpdir(), allowEmptyFiles: true, minFileSize: 0 });
        form.on('field', (name, value) => {
            data[name] = value;
        })
            .on('file', (name, file) => {
                if (file.size > 0 && file.originalFilename) {
                    if (!files[name]) {
                        files[name] = [];
                    }
                    files[name].push(file);
                }
            })
            .on('end', async () => {
                req.data = data;
                req.files = files;
                return await final(on_end, req, res, uid, start);
            });
        form.parse(req);
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

export async function final(on_end, req, res, uid, start) {
    if (is_func(on_end)) {
        return await on_end(req, res, uid, start);
    }
    return return_not_found(req, res, uid, 'Not found', 404, start);
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
export function log_end(req, res, uid, start) {
    const type = (res.statusCode + '')[0]; // first digit inticates the type
    const message = [req.method, req.url, ...get_base_log_infos(res.statusMessage, res.statusCode, start, uid)];
    switch (type) {
        case '1':
            Logger.info(...message);
            return;
        case '2':
            if (show_all_requests) {
                Logger.success(...message);
            }
            return;
        case '3':
            if (show_all_requests) {
                Logger.warning(...message);
            }
            return;
        default:
            Logger.error(...message);
            return;
    }
}
export function is_data_method(method) {
    return ['post', 'patch', 'put'].indexOf(method.toLowerCase()) > -1;
}
export function return_not_found(req, res, uid, message, status, start) {
    Logger.error(req.method, req.url, ...get_base_log_infos(message, status, start, uid));
    send_head(res, status, 'text/html');
    send_content(res, message);
    return;
}
export function get_base_log_infos(message, status, start, uid) {
    const date = new Date();
    return [
        `${status}${Logger.color.dim(`(${message})`)}`,
        nano_to_milli(process.hrtime.bigint() - start) + Logger.color.dim('ms'),
        date.toLocaleTimeString(),
        Logger.color.dim(date.toLocaleDateString()),
        Logger.color.dim(uid),
    ];
}

export function send_head(res, status, content_type) {
    if (!res.headersSent && status) {
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
export async function static_server(req, res, uid, on_end) {
    const cache = Env.is_prod() ? 3600 : false;
    const start = log_start(req, uid);

    if (!static_server_instance) {
        static_server_instance = new NodeStatic.Server(Cwd.get('pub'), {
            cache,
            serverInfo: `wyvr`,
        });
    }
    // static server is not able to handle other requests then get, avoid post, put, patch
    if (!is_data_method(req.method)) {
        static_server_instance.serve(req, res, async (err) => {
            await static_server_final(err, req, res, uid, on_end, start);
        });
    } else {
        await static_server_final({ message: 'Not found', status: 404 }, req, res, uid, on_end, start);

        if (res.writableEnded) {
            log_end(req, res, uid, start);
        }
    }
}

async function static_server_final(err, req, res, uid, on_end, start) {
    if (is_func(on_end)) {
        await on_end(err, req, res, uid);

        if (!res.writableEnded) {
            return return_not_found(req, res, uid, err.message, err.status, start);
        }
    }
    if (res.writableEnded) {
        log_end(req, res, uid, start);
    }
}

export function app_server(host, port) {
    generate_server(host, port, false, undefined, undefined);
}

export function watch_server(host, port, wsport, fallback) {
    Logger.emit = true;
    show_all_requests = false;
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
            const buffer = await get_buffer(media_config.src);
            if (buffer) {
                const start = process.hrtime.bigint();
                // generate media on demand
                await WorkerController.process_data(WorkerAction.media, [media_config]);
                // the file needs some time to be available after generation
                const success = await wait_for(() => {
                    return exists(Cwd.get(media_config.result));
                });

                Logger[success ? 'success' : 'error'](
                    'generate media',
                    nano_to_milli(process.hrtime.bigint() - start),
                    Logger.color.dim('ms'),
                    Logger.color.dim(uid)
                );
            }
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
