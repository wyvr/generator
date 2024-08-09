import { createServer } from 'node:http';
import formidable, { errors as formidableErrors } from 'formidable';
import { Logger } from './logger.js';
import { in_array, is_func, is_number } from './validate.js';
import { uniq_id } from './uniq.js';
import ServeStatic from 'serve-static';
import { WebSocketServer } from 'ws';
import { Cwd } from '../vars/cwd.js';
import { get_error_message } from './error.js';
import { nano_to_milli } from './convert.js';
import { Env } from '../vars/env.js';
import {
    route_request,
    fallback_route_request,
    apply_response,
} from '../action/route.js';
import { config_from_url, get_buffer } from './media.js';
import { Event } from './event.js';
import { stringify } from './json.js';
import { LogType } from '../struc/log.js';
import { watcher_event } from './watcher.js';
import { wait_for } from './wait.js';
import { WatcherPaths } from '../vars/watcher_paths.js';
import { copy, exists, read, remove, to_extension, write } from './file.js';
import { WorkerController } from '../worker/controller.js';
import { WorkerAction } from '../struc/worker_action.js';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { get_route } from './routes.js';
import { get_config_cache } from './config_cache.js';
import { pub_healthcheck } from './health.js';
import { to_dirname } from './to.js';
import { inject } from './build.js';
import { register_stack } from './global.js';
import { media } from '../action_worker/media.js';
import { IsWorker } from '../vars/is_worker.js';
import { build_hydrate_file_from_url } from './script.js';
import { ReleasePath } from '../vars/release_path.js';
import { setRequestId } from '../vars/request_id.js';
import { Config } from './config.js';

let show_requests = true;
let app_performance_limit_warning;

export function server(port, on_request, on_end) {
    if (!is_number(port)) {
        Logger.warning('server could not be started because port is missing');
        return;
    }
    createServer(async (req, res) => {
        const start = process.hrtime.bigint();
        const uid = uniq_id();
        if (Env.is_dev()) {
            res.setHeader('Wyvr-Uid', uid);
        }
        req.uid = uid;
        setRequestId(uid);

        // force redirect to urls with / at the end
        const url = req.url;
        const clean_url = url.replace(/\?.*/, '').replace(/#.*/, '');
        const question_mark = url.indexOf('?');
        const hash = url.indexOf('#');
        if (!extname(clean_url) && clean_url[clean_url.length - 1] !== '/') {
            const params_pos = Math.min(
                question_mark > -1 ? question_mark : Number.MAX_SAFE_INTEGER,
                hash > -1 ? hash : Number.MAX_SAFE_INTEGER
            );
            res.writeHead(Env.is_dev() ? 302 : 301, undefined, {
                location: `${clean_url}/${url.substring(params_pos)}`,
            });
            res.end();
            return;
        }
        if (is_func(on_request)) {
            on_request(req, res, uid, start);
        }
        let files = {};
        let body = {};
        const query = {};
        // add query parameters to the request
        if (question_mark > -1) {
            const params = new URLSearchParams(
                url.substring(question_mark + 1)
            );
            for (const key of params.keys()) {
                query[key] = params.get(key);
            }
        }

        req.query = query;
        // stop without parsing the body when not post, patch, put
        if (!is_data_method(req.method)) {
            req.body = body;
            req.files = files;
            return await final(on_end, req, res, uid, start);
        }
        // allow sending files
        const form = formidable({
            keepExtensions: true,
            uploadDir: tmpdir(),
            allowEmptyFiles: true,
            minFileSize: 0,
        });
        try {
            [body, files] = await form.parse(req);
            req.body = body;
            req.files = files;
        } catch (err) {
            if (!in_array([formidableErrors.noParser], err.code)) {
                Logger.error(get_error_message(err, clean_url, 'request body'));
            }
        }
        return await final(on_end, req, res, uid, start);
    }).listen({ port }, () => {
        const pre_text = 'server started at';
        const text = `http://localhost:${port}`;
        const filler = new Array(2 + pre_text.length + 1 + text.length)
            .fill('─')
            .join('');
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
    return await return_not_found(req, res, uid, 'Not found', 404, start);
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
    const message = [
        req.method,
        req.url,
        ...get_done_log_infos(res.statusMessage, res.statusCode, start, uid),
    ];
    const type = `${res.statusCode}`[0]; // first digit indicates the type
    const type_logger = {
        1: (message) => Logger.info(...message),
        2: (message) => Logger.success(...message),
        3: (message) => Logger.warning(...message),
        4: (message) => Logger.warning(...message),
        _: (message) => Logger.error(...message),
    };
    (type_logger[type] || type_logger._)(message);
}
export function is_data_method(method) {
    return ['post', 'patch', 'put'].indexOf(method.toLowerCase()) > -1;
}
export async function return_not_found(req, res, uid, message, status, start) {
    Logger.error(
        req.method,
        req.url,
        ...get_done_log_infos(message, status, start, uid)
    );
    let return_content = message;
    if (Env.is_dev()) {
        // use full page in dev mode to add devtools, which allow autoreloading the page
        const content = read(
            join(to_dirname(import.meta.url), '..', 'resource', '404.html')
        );
        if (content) {
            const url = req.url;
            try {
                const result = await inject(
                    {
                        result: {
                            html: content
                                .replace(/\{message\}/g, message)
                                .replace(/\{status\}/g, status)
                                .replace(/\{uid\}/g, uid)
                                .replace(/\{url\}/g, url),
                        },
                    },
                    { url, message, status, uid },
                    url,
                    'wyvr_development'
                );
                return_content = result.content;
            } catch (e) {
                Logger.error(get_error_message(e, url, 'return_not_found'));
            }
        }
    }
    send_head(res, status, 'text/html');
    send_content(res, return_content);
    return;
}
export function get_done_log_infos(message, status, start, uid) {
    return [
        `${status}${Logger.color.dim(`(${message})`)}`,
        ...get_time_log_infos(start, uid),
    ];
}
export function get_time_log_infos(start = undefined, uid = undefined) {
    const date = new Date();
    const end = process.hrtime.bigint();
    let text = undefined;
    if (start) {
        const ms = nano_to_milli(end - (start ?? end));
        text = ms + Logger.color.dim('ms');
        // get the value when not already set
        if (!app_performance_limit_warning) {
            app_performance_limit_warning = Config.get(
                'worker.app_performance_limit_warning',
                false
            );
        }
        // add formating when the value is set
        if (Env.is_prod() && is_number(app_performance_limit_warning)) {
            if (ms > app_performance_limit_warning * 0.8) {
                if (ms > app_performance_limit_warning) {
                    text = Logger.color.red(`${text}(slow)`);
                } else {
                    text = Logger.color.yellow(`${text}(sluggish)`);
                }
            }
        }
    }
    return [
        text,
        date.toLocaleTimeString(),
        Logger.color.dim(date.toLocaleDateString()),
        uid ? Logger.color.dim(uid) : undefined,
    ].filter((x) => x);
}

export function send_head(res, status, content_type) {
    if (res.complete || res.writableEnded) {
        return res;
    }
    const headers = {};
    if (content_type) {
        headers['Content-Type'] = content_type;
    }
    res.writeHead(status, undefined, headers);
    return res;
}
export function send_content(res, content) {
    if (res.complete || res.writableEnded) {
        return res;
    }
    res.end(content);
    return res;
}

let static_server_instance;
export async function static_server(req, res, uid, on_end) {
    const start = log_start(req, uid);

    if (!static_server_instance) {
        static_server_instance = new ServeStatic(Cwd.get('pub'), {
            cacheControl: Env.is_prod(),
            etag: Env.is_prod(),
            maxAge: Env.is_prod() ? 3600 : false,
            dotfiles: 'ignore',
        });
    }
    // static server is not able to handle other requests then get, avoid post, put, patch
    if (!is_data_method(req.method)) {
        static_server_instance(req, res, async () => {
            await static_server_final(
                { message: 'Not found', status: 404 },
                req,
                res,
                uid,
                on_end,
                start
            );
        });
    } else {
        await static_server_final(
            { message: 'Not found', status: 404 },
            req,
            res,
            uid,
            on_end,
            start
        );
    }
}

async function static_server_final(err, req, res, uid, on_end, start) {
    if (is_func(on_end)) {
        await on_end(err, req, res, uid);

        if (!res.writableEnded) {
            return await return_not_found(
                req,
                res,
                uid,
                err.message,
                err.status,
                start
            );
        }
    }
    if (res.writableEnded) {
        log_end(req, res, uid, start);
    }
}

// @NOTE: will be started in the workers
export async function app_server(port) {
    return new Promise((resolve, reject) => {
        generate_server(port, false, undefined, undefined).catch((e) => {
            Logger.error(
                get_error_message(e, undefined, `worker error ${process.pid}`)
            );
            reject();
        });
    });
}

export function watch_server(port, wsport, packages, fallback) {
    Logger.emit = true;
    show_requests = false;
    generate_server(
        port,
        true,
        () => {
            Logger.info('onEnd');
        },
        fallback
    );
    websocket_server(wsport, packages);
}

async function generate_server(
    port,
    force_generating_of_resources,
    onEnd,
    fallback
) {
    register_stack();

    server(port, undefined, async (req, res, uid) => {
        // check if pub is available
        pub_healthcheck();
        // check for media files
        const name = basename(req.url);
        const media_config = await config_from_url(req.url);
        if (media_config && !media_config.result_exists) {
            let buffer = await get_buffer(media_config.src);
            if (buffer) {
                buffer = undefined;
                const start = process.hrtime.bigint();
                // generate media on demand
                if (IsWorker.get()) {
                    await media([media_config]);
                } else {
                    await WorkerController.process_data(WorkerAction.media, [
                        media_config,
                    ]);
                }
                // the file needs some time to be available after generation started
                const success = await wait_for(() => {
                    return exists(Cwd.get(media_config.result));
                });
                if (show_requests) {
                    Logger[success ? 'success' : 'error'](
                        'media',
                        name,
                        ...get_time_log_infos(start, uid)
                    );
                }
            }
        }

        await static_server(req, res, uid, async (err) => {
            if (err) {
                // check if css or js files should be generated
                if (req.url.indexOf('/js') === 0) {
                    const file_content = await build_hydrate_file_from_url(
                        req.url
                    );
                    if (file_content) {
                        res = send_head(res, 200, 'application/javascript');
                        res.end(file_content);
                        return;
                    }
                }

                const ghost_path = join(
                    ReleasePath.get(),
                    req.url.replace(/\/(?:index\.html)?$/, '/index.ghost')
                );
                const shadow_path = to_extension(ghost_path, '.shadow');
                let ghost_delivered = false;

                if (exists(ghost_path)) {
                    const content = read(ghost_path);
                    if (content) {
                        res = send_head(res, 200, 'text/html');
                        res.end(content);
                        ghost_delivered = true;
                    }
                    // stop after delivering the ghost file, because the file is already generated by another process call
                    if (exists(shadow_path)) {
                        return;
                    }
                    // add marker that the file is in progress
                    write(shadow_path, '');
                }

                const route_response = await route_request(
                    req,
                    res,
                    uid,
                    force_generating_of_resources
                );

                // when ghost file was delivered, remove it and also the shadow file
                if (ghost_delivered) {
                    remove(ghost_path);
                    remove(shadow_path);
                    return;
                }
                if (route_response) {
                    res = apply_response(res, route_response);
                    return;
                }
                if (!route_response.complete) {
                    if (is_func(fallback)) {
                        await fallback(req, res, uid, err);
                        return false;
                    }
                    // fallback_route_request returns an response
                    const fallback_route_response =
                        await fallback_route_request(req, res, uid);
                    if (fallback_route_response) {
                        res = apply_response(res, fallback_route_response);
                        return;
                    }
                }
                return false;
            }
            return true;
        });
    });
}

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
