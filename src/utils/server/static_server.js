import { is_func } from './../validate.js';
import ServeStatic from 'serve-static';
import { Cwd } from '../../vars/cwd.js';
import { Env } from '../../vars/env.js';
import { is_data_method, return_not_found } from './helpers.js';
import { log_end, log_start } from './log.js';

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
