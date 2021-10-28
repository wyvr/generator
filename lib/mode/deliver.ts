import { createServer } from 'http';
import { Port } from '@lib/port';
import { Logger } from '@lib/logger';
import { Media } from '@lib/media';
import { uniq } from '@lib/helper/uniq';
import { hrtime_to_ms } from '@lib/converter/time';
import { LogType } from '@lib/model/log';
import { Config } from '@lib/config';
import { delay } from '@lib/helper/delay';
import { between } from '@lib/helper/random';
import { idle } from '@lib/helper/endings';

export class DeliverMode {
    constructor(private on_demand_port: number = 4000) {
        const allowed_domains = Config.get('media.allowed_domains');
        Logger.present('allowed', Array.isArray(allowed_domains) ? allowed_domains : Logger.color.yellow('only local'));
    }
    async start() {
        // get unused port
        this.on_demand_port = await Port.find(this.on_demand_port); // socket

        Logger.present('on demand server port', this.on_demand_port);
        const host = 'localhost';

        createServer((req, res) => {
            const start = process.hrtime();
            const uid = uniq();
            Logger.block(uid, req.method, req.url, new Date().toISOString());

            req.addListener('end', async () => {
                const media_config = Media.extract_config(req.url);

                if (!media_config) {
                    Logger.warning(uid, 'no media config found');
                    await delay(between(350, 1000));
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(null);
                }
                return Media.serve(
                    res,
                    media_config,
                    () => {
                        const duration = Math.round(hrtime_to_ms(process.hrtime(start)) * 100) / 100;
                        Logger.output(LogType.log, Logger.color.dim, '░', uid, Logger.color.reset(duration + ''), 'ms');
                    },
                    async (message) => {
                        Logger.error(uid, message);
                        await delay(between(350, 1000));
                        return null;
                    }
                );
            }).resume();
        }).listen(this.on_demand_port, host, () => {
            Logger.success('server started', `http://${host}:${this.on_demand_port}`);
            idle('requests');
        });
    }
}