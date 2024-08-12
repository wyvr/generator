import { Logger } from './../logger.js';
import { get_error_message } from './../error.js';
import { Env } from '../../vars/env.js';
import { read } from './../file.js';
import { join } from 'node:path';
import { to_dirname } from './../to.js';
import { inject } from './../build.js';

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
