/* eslint @typescript-eslint/no-explicit-any: 0 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { idle } from '@lib/helper/endings';
import { Logger } from '@lib/logger';
import { uniq } from './helper/uniq';

export const server = (
    host: string,
    port: number,
    idle_text: string = null,
    on_request: (req: IncomingMessage, uid: string, start: [number, number]) => void = null,
    on_end: (req: IncomingMessage, res: ServerResponse, uid: string, start: [number, number]) => Promise<any> = null
) => {
    createServer((req, res) => {
        const start = process.hrtime();
        const uid = uniq();
        if (on_request && typeof on_request == 'function') {
            on_request(req, uid, start);
        }

        req.addListener('end', async () => {
            if (on_end && typeof on_end == 'function') {
                return await on_end(req, res, uid, start);
            }
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(null);
        }).resume();
    }).listen(port, host, () => {
        Logger.success('server started', `http://${host}:${port}`);
        idle(idle_text);
    });
};
