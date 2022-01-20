import { Env } from '@lib/env';
import { join } from 'path';
import { Cwd } from '@lib/vars/cwd';
import { File } from '@lib/file';
import { IncomingMessage, ServerResponse } from 'http';
import { Logger } from '@lib/logger';
import { Client } from '@lib/client';
import { SocketPort } from '@lib/vars/socket_port';
import { Media } from '@lib/media';
import { hrtime_to_ms } from '@lib/converter/time';
import { Exec } from '@lib/exec';

function generate_loading_page() {
    const cache_file_path = join(Cwd.get(), 'cache', 'loading_page.html');

    const cache_file = File.read(cache_file_path);
    if (cache_file) {
        Logger.debug('loaded loading page');
        return cache_file;
    }

    let socket_script = '';
    const page_path = join(__dirname, '..', 'resource', 'page.html');
    const page = File.read(page_path);
    if (!page) {
        Logger.warning('missing page path', page_path);
        return undefined;
    }
    const client_socket_path = join(__dirname, '..', 'resource', 'client_socket.js');
    const client_socket = File.read(client_socket_path);
    if (!client_socket) {
        Logger.warning('missing client socket path', client_socket_path);
        return undefined;
    }
    socket_script = `<script id="wyvr_client_socket">
        window.wyvr_generate_page = true;
        (function wyvr_generate_page() {
            localStorage.removeItem('wyvr_socket_history');
            window.setTimeout(() => {
                location.href = location.href;
            }, 30000);
        })();
        ${Client.transform_resource(client_socket.replace(/\{port\}/g, SocketPort.get() + ''))}</script>`;

    const content = page
        .replace(/\{content\}/g, 'Page will be generated, please wait &hellip;')
        .replace(/\{script\}/g, socket_script);

    File.write(cache_file_path, content);
    Logger.debug('generated loading page');

    return content;
}

export default async (req: IncomingMessage, res: ServerResponse, uid: string, err) => {
    // check if the url is a page which should be generated
    if (Env.is_dev()) {
        // collect files
        const data_path = join(Cwd.get(), 'gen', 'data', File.to_index(req.url, '.json'));
        const exists = File.is_file(data_path);
        Logger.debug('request', req.url, data_path, exists);
        if (exists) {
            // build the page
            Logger.block('generate', req.url);

            const content = generate_loading_page();
            if (content) {
                res.writeHead(200, {
                    'Content-Type': 'text/html',
                });
                res.end(content);
                return;
            }
        }
    }

    // check for media files
    const media_config = Media.extract_config(req.url);
    if (media_config) {
        const start = process.hrtime();
        return Media.serve(
            res,
            media_config,
            async () => {
                const duration = Math.round(hrtime_to_ms(process.hrtime(start)) * 100) / 100;
                Logger.block(`processed ${media_config.src} in ${duration} ms`);
            },
            async (message) => {
                Logger.error(media_config.src, message);
            }
        );
    }
    // check for matching exec
    const exec_config = Exec.match(req.url);
    if (exec_config) {
        Logger.info(uid, 'exec', req.url);
        const rendered = await Exec.run(uid, req, res, exec_config);
        if (rendered && !res.writableEnded) {
            // res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(rendered.result.html);
            return;
        }
    }
    // check for universal/fallback exec
    if (await Exec.fallback(uid, req, res)) {
        return;
    }

    Logger.error('serve error', Logger.color.bold(err.message), req.method, req.url, err.status);
    res.writeHead(err.status, err.headers);
    res.end();
};
