import { Logger } from '@lib/logger';
import { File } from '@lib/file';
import { Dir } from '@lib/dir';
import { Error } from '@lib/error';
import { MediaModel, MediaModelOutput } from '@lib/model/media';
import { dirname } from 'path';
import sharp from 'sharp';

export class Media {
    static async get_config(content: string): Promise<MediaModel> {
        // get the config of the media
        const config = new MediaModel(Media.get_config_from_content(content));
        // create config hash to group different images together
        const hash = MediaModel.get_config_hash(config);
        config.hash = hash;
        let src = config.src;
        let domain = null;
        if (src.indexOf('http') == 0) {
            const domain_match = src.match(/^https?:\/\/([^\/]*?)\//);
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
    static get_config_from_content(content: string): any {
        const exec_code = `(() => {
            return {${content.replace(/&quot;/g, '"').replace(/&#39;/g, "'")}}
        })()`;
        try {
            const result = eval(exec_code);
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
        const matches = url.match(/^\/media\/([^\/]+)\/(.*)/);
        if (!matches) {
            return null;
        }
        let result: any | MediaModel = {};
        // check for domain matches
        if (matches[1] == '_d') {
            const domain_matches = matches[2].match(/^([^\/]+)\/([^\/]+)\/(.*)/);
            if (!domain_matches) {
                return null;
            }
            try {
                const config_string = Buffer.from(domain_matches[2], 'base64').toString('ascii');
                result = JSON.parse(config_string);
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
        } catch (e) {
            Logger.error(Error.get(e, matches[2], 'media on demand'));
        }
        result.src = matches[2];
        result.result = url;
        result.output = MediaModelOutput.Path;

        return result;
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
        const options: any = { fit: media.mode, position: 'centre' };
        if (media.width != null && media.width > -1) {
            options.width = media.width;
        }
        if (media.height != null && media.height > -1) {
            options.height = media.height;
        }
        try {
            Logger.info(media.src, JSON.stringify(options));
            const modified_image = await sharp(buffer).resize(options);
            if (media.output != MediaModelOutput.Path) {
                Logger.warning('media', `${media.src} output "${media.output}" is not implemented at the moment`);
            }
            await modified_image.toFile(output);
        } catch (e) {
            Logger.error(Error.get(e, media.src, 'sharp'));
        }
        return null;
    }
}
