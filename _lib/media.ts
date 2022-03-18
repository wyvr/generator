import { Logger } from '@lib/logger';
import { File } from '@lib/file';
import { Dir } from '@lib/dir';
import { Error } from '@lib/error';
import { MediaModel, MediaModelMode, MediaModelOutput } from '@lib/model/media';
import { dirname, join } from 'path';
import sharp from 'sharp';
import { ServerResponse } from 'http';
import { Config } from '@lib/config';
import { Cwd } from '@lib/vars/cwd';

export class Media {
    static allowed_domains = null;
    static async get_config(content: string): Promise<MediaModel> {
        // get the config of the media
        const config = new MediaModel(Media.get_config_from_content(content));
        // create config hash to group different images together
        const hash = MediaModel.get_config_hash(config);
        config.hash = hash;
        let src = config.src;
        let domain = null;
        if (src.indexOf('http') == 0) {
            const domain_match = src.match(/^https?:\/\/([^/]*?)\//);
            if (domain_match) {
                domain = MediaModel.get_hash(domain_match[1]);
                src = src.substring(src.indexOf(domain_match[1]) + domain_match[1].length).replace(/^\//, '');
            }
        }
        if (domain) {
            config.result = `/media/_d/${domain}/${hash}/${src}`;
        } else {
            config.result = `/media/${hash}/${src}`;
        }
        // return the newly combined path
        return config;
    }
    static get_config_from_content(content: string): MediaModel {
        const exec_code = `(() => {
            return {${content.replace(/&quot;/g, '"').replace(/&#39;/g, "'")}}
        })()`;
        try {
            const result = eval(exec_code);
            result.format = this.correct_format(result.format, result.src);
            return result;
        } catch (e) {
            Logger.error(Error.get(e, null, 'media'));
        }
        return null;
    }
    static extract_config(url: string) {
        if (!url || typeof url != 'string') {
            return null;
        }
        const matches = url.match(/^\/media\/([^/]+)\/(.*)/);
        if (!matches) {
            return null;
        }

        let result: MediaModel = new MediaModel({});
        // check for domain matches
        if (matches[1] == '_d') {
            const domain_matches = matches[2].match(/^([^/]+)\/([^/]+)\/(.*)/);
            if (!domain_matches) {
                return null;
            }
            try {
                const config_string = Buffer.from(domain_matches[2], 'base64').toString('ascii');
                result = JSON.parse(config_string);
                result.format = this.correct_format(result.format, url);
            } catch (e) {
                Logger.error(Error.get(e, domain_matches[3], 'media on demand'));
            }
            result.domain = Buffer.from(domain_matches[1], 'base64').toString('ascii');
            result.src = `https://${result.domain}/${domain_matches[3]}`;
            result.result = url;
            result.output = MediaModelOutput.Path;
            return result;
        }
        // extract local file
        try {
            const config_string = Buffer.from(matches[1], 'base64').toString('ascii');
            result = JSON.parse(config_string);
            result.format = this.correct_format(result.format, url);
        } catch (e) {
            Logger.error(Error.get(e, matches[2], 'media on demand'));
        }
        result.src = matches[2];
        result.result = url;
        result.output = MediaModelOutput.Path;

        return result;
    }
    static correct_format(format: string, src: string) {
        if (!format || format == 'null') {
            const ext_match = src.match(/\.([^.]+)$/);
            if (ext_match) {
                if (ext_match[1] == 'jpg') {
                    ext_match[1] = 'jpeg';
                }
                return ext_match[1];
            }
            return null;
        }
        return format;
    }
    static async process(media: MediaModel) {
        const output = MediaModel.get_output(media.result);
        const exists = File.is_file(output);
        // create only when not already exists
        if (exists) {
            return null;
        }
        const buffer = await MediaModel.get_buffer(media.src);
        if (!buffer) {
            Logger.error('@media', `input file "${media.src}" doesn't exist`);
            return null;
        }
        Dir.create(dirname(output));
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const options: any = { fit: media.mode, position: 'centre' };
        /* eslint-enable */
        if (media.width != null && media.width > -1) {
            options.width = Math.ceil(media.width);
        }
        if (media.height != null && media.height > -1) {
            options.height = Math.ceil(media.height);
        }
        // add white background when empty space can be added and format is not transparent able
        if (['jpg', 'jpeg'].indexOf(media.format) > -1 && media.mode != MediaModelMode.Cover) {
            options.background = { r: 255, g: 255, b: 255 };
        }
        Logger.debug(media.src, JSON.stringify(options));
        let modified_image = undefined;
        try {
            modified_image = await sharp(buffer).resize(options);
        } catch (e) {
            Logger.error(Error.get(e, media.src, 'sharp'));
            return null;
        }
        if (media.output != MediaModelOutput.Path) {
            Logger.warning('media', `${media.src} output "${media.output}" is not implemented at the moment`);
        }
        let output_buffer = null;
        try {
            switch (media.format) {
                case 'jpg':
                case 'jpeg':
                    output_buffer = await modified_image.jpeg({ quality: media.quality }).toBuffer();
                    break;
                case 'avif':
                    output_buffer = await modified_image.avif({ quality: media.quality }).toBuffer();
                    break;
                case 'heif':
                    output_buffer = await modified_image.heif({ quality: media.quality }).toBuffer();
                    break;
                case 'webp':
                    output_buffer = await modified_image.webp().toBuffer();
                    break;
                case 'png':
                    output_buffer = await modified_image.png().toBuffer();
                    break;
                case 'gif':
                    output_buffer = await modified_image.png().toBuffer();
                    break;
            }
            if (!output_buffer) {
                Logger.error(Error.get({ message: 'no buffer available' }, media.src, 'sharp'));
                return null;
            }
            // output_buffer is arraybuffer and has to be converter
            File.write(output, Buffer.from(output_buffer));
        } catch (e) {
            Logger.error(Error.get(e, media.src, 'sharp'));
            return null;
        }

        return null;
    }
    static async serve(
        res: ServerResponse,
        media_config: MediaModel,
        on_end: () => Promise<void> = null,
        on_fail: (message: string) => Promise<void> = null
    ) {
        if (!Media.allowed_domains) {
            const allowed_domains = Config.get('media.allowed_domains');
            if (Array.isArray(allowed_domains)) {
                // cleanup the domains in case when protoll has been added
                Media.allowed_domains = allowed_domains
                    .map((domain) => {
                        return domain.replace(/^https?:\/\//, '').split('/')[0];
                    })
                    .filter((x) => x);
            } else {
                Media.allowed_domains = [];
            }
        }
        const end = async (res, value) => {
            if (on_end && typeof on_end == 'function') {
                await on_end();
            }
            res.end(value);
            return;
        };
        const fail = async (res, message) => {
            if (on_fail && typeof on_fail == 'function') {
                await on_fail(message);
            }
            await end(res, null);
            return;
        };
        // check for allowed domain
        const allowed =
            !media_config.domain ||
            (Array.isArray(this.allowed_domains) &&
                this.allowed_domains.find((domain) => media_config.domain == domain));
        if (!allowed) {
            return await fail(res, `domain "${media_config.domain}" not allowed`);
        }
        // create the cache file
        try {
            await Media.process(media_config);
        } catch (e) {
            return await fail(res, Error.get(e, media_config.result));
        }
        // read created file and serve it
        const buffer = File.read_buffer(join(Cwd.get(), MediaModel.get_output(media_config.result)));
        if (buffer) {
            res.writeHead(200, { 'Content-Type': `image/${media_config.format}` });
            return await end(res, buffer);
        }
        return await fail(res, 'no file found');
    }
}
