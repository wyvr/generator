import { createServer } from 'http';
import { join } from 'path';
import { Port } from '@lib/port';
import { Logger } from '@lib/logger';
import { Media } from '@lib/media';
import { uniq } from '@lib/helper/uniq';
import { Error } from '@lib/error';
import { File } from '@lib/file';
import { MediaModel } from '@lib/model/media';
import { hrtime_to_ms } from '@lib/converter/time';
import { LogType } from '@lib/model/log';
import { Config } from '@lib/config';
import { delay } from '@lib/helper/delay';
import { between } from '@lib/helper/random';

export class Deliver {
    allowed_domains: string[] = null;
    constructor(private on_demand_port: number = 4000) {
        this.allowed_domains = Config.get('media.allowed_domains');
        Logger.present('allowed', Array.isArray(this.allowed_domains) ? this.allowed_domains : Logger.color.yellow('only local'));
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
                    return await this.fail(uid, res, start);
                }
                // check for allowed domain
                let allowed = !media_config.domain || (Array.isArray(this.allowed_domains) && this.allowed_domains.find((domain) => media_config.domain == domain));
                if (!allowed) {
                    Logger.warning(uid, `domain "${media_config.domain}" not allowed`);
                    return await this.fail(uid, res, start);
                }
                // create the cache file
                try {
                    await Media.process(media_config);
                } catch (e) {
                    Logger.error(uid, Error.get(e, media_config.result));
                    return await this.fail(uid, res, start);
                }

                const buffer = File.read_buffer(join(process.cwd(), MediaModel.get_output(media_config.result)));
                if (buffer) {
                    res.writeHead(200, { 'Content-Type': `image/${media_config.format}` });
                    Logger.info(uid, 'file sent');
                    return this.end(uid, res, start, buffer);
                }
                Logger.warning(uid, 'no file found');
                return await this.fail(uid, res, start);
            }).resume();
        }).listen(this.on_demand_port, host, () => {
            Logger.success('server started', `http://${host}:${this.on_demand_port}`);
            Logger.idle('requests');
        });
    }

    async fail(uid: string, res: any, hr_start: [number, number]) {
        await delay(between(350, 1000));
        res.writeHead(404, { 'Content-Type': 'text/html' });
        return this.end(uid, res, hr_start, '');
    }

    end(uid: string, res: any, hr_start: [number, number], value: any = null) {
        const duration = Math.round(hrtime_to_ms(process.hrtime(hr_start)) * 100) / 100;
        Logger.output(LogType.log, Logger.color.dim, '░', uid, Logger.color.reset(duration + ''), 'ms');
        res.end(value);
        return;
    }
}
