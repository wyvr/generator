import { createServer } from 'node:http';
import formidable, { errors as formidableErrors } from 'formidable';
import { Logger } from './../logger.js';
import { in_array, is_func, is_number } from './../validate.js';
import { uniq_id } from './../uniq.js';
import { get_error_message } from './../error.js';
import { Env } from '../../vars/env.js';
import { tmpdir } from 'node:os';
import { extname } from 'node:path';
import { setRequestId } from '../../vars/request_id.js';
import { is_data_method, return_not_found } from './helpers.js';

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
            const params_pos = Math.min(question_mark > -1 ? question_mark : Number.MAX_SAFE_INTEGER, hash > -1 ? hash : Number.MAX_SAFE_INTEGER);
            res.writeHead(Env.is_dev() ? 302 : 301, undefined, {
                location: `${clean_url}/${url.substring(params_pos)}`
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
            const params = new URLSearchParams(url.substring(question_mark + 1));
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
            minFileSize: 0
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
    return await return_not_found(req, res, uid, 'Not found', 404, start);
}
