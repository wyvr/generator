import { dirname, join } from 'path';
import replaceAsync from 'string-replace-async';
import { FOLDER_MEDIA } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { create_dir, is_file, read_buffer, to_extension, write } from './file.js';
import { filled_string, match_interface } from './validate.js';
import axios from 'axios';
import sharp from 'sharp';
import { MediaModel } from '../model/media.js';
import { Logger } from './logger.js';
import { get_error_message } from './error.js';
import { MediaModelMode, MediaModelOutput } from '../struc/media.js';

export async function process(media) {
    if (!match_interface(media, { result: true })) {
        return undefined;
    }
    const output = get_output(media.result);
    const exists = is_file(output);
    // create only when not already exists
    if (exists) {
        return undefined;
    }
    const buffer = await get_buffer(media.src);
    if (!buffer) {
        Logger.error('@media', `input file "${media.src}" doesn't exist`);
        return undefined;
    }
    create_dir(dirname(output));
    const options = { fit: media.mode, position: 'centre' };
    if (media.width != null && media.width > -1) {
        options.width = Math.ceil(media.width);
    }
    if (media.height != null && media.height > -1) {
        options.height = Math.ceil(media.height);
    }
    // add white background when empty space can be added and format is not transparent able
    if (['jpg', 'jpeg'].indexOf(media.format) > -1 && media.mode != MediaModelMode.cover) {
        options.background = { r: 255, g: 255, b: 255 };
    }
    Logger.debug(media.src, JSON.stringify(options));
    let modified_image;
    try {
        modified_image = await sharp(buffer).resize(options);
    } catch (e) {
        Logger.error(get_error_message(e, media.src, 'sharp'));
        return undefined;
    }
    if (media.output != MediaModelOutput.path) {
        Logger.warning('media', `${media.src} output "${media.output}" is not implemented at the moment`);
    }
    let output_buffer;
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
            Logger.error(get_error_message({ message: 'no buffer available' }, media.src, 'sharp'));
            return undefined;
        }
        // output_buffer is arraybuffer and has to be converter
        write(output, Buffer.from(output_buffer));
    } catch (e) {
        Logger.error(get_error_message(e, media.src, 'sharp'));
        return undefined;
    }

    return undefined;
}

/*
export function extract_config(url) {
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
*/

export async function replace_media(content) {
    const result = {
        content: '',
        media: {},
        has_media: false,
    };
    if (!filled_string(content)) {
        return result;
    }
    result.content = await replaceAsync(content, /\(media\(([\s\S]*?)\)\)/g, async (match_media, inner) => {
        const config = await get_config(inner);
        // store for later transformation
        result.has_media = true;
        result.media[config.result] = config;
        return config.result;
    });

    return result;
}

export async function get_config(content) {
    // get the config of the media
    const config = new MediaModel(get_config_from_content(content));
    // create config hash to group different images together
    const hash = get_config_hash(config);
    config.hash = hash;
    let src = to_extension(config.src, config.format);
    let domain = null;
    if (src.indexOf('http') == 0) {
        const domain_match = src.match(/^https?:\/\/([^/]*?)\//);
        if (domain_match) {
            domain = get_hash(domain_match[1]);
            src = src.substring(src.indexOf(domain_match[1]) + domain_match[1].length).replace(/^\//, '');
        }
    }
    if (domain) {
        config.result = `/${FOLDER_MEDIA}/_d/${domain}/${hash}/${src}`;
    } else {
        config.result = `/${FOLDER_MEDIA}/${hash}/${src}`;
    }
    // return the newly combined path
    return config;
}

export function get_config_from_content(content) {
    const exec_code = `(() => {
        return {${content.replace(/&quot;/g, '"').replace(/&#39;/g, "'")}}
    })()`;
    try {
        const result = eval(exec_code);
        result.format = correct_format(result.format, result.src);
        return result;
    } catch (e) {
        Logger.error(get_error_message(e, null, 'media'));
    }
    return undefined;
}

export function get_config_hash(config) {
    const hash_config = {};
    ['width', 'height', 'mode', 'format', 'quality'].forEach((key) => {
        if (config[key]) {
            hash_config[key] = config[key];
        }
    });
    return get_hash(JSON.stringify(hash_config));
}
export function get_hash(value) {
    // const hash = cryptoCreateHash('sha256');
    // hash.update(value);
    // return hash.digest('hex').substr(0, 16);
    return Buffer.from(value).toString('base64');
}
export async function get_buffer(src) {
    if (!src) {
        return null;
    }
    // download the image and return buffer from it
    if (src.indexOf('http') == 0) {
        try {
            const res = await axios({
                url: src,
                method: 'GET',
                responseType: 'arraybuffer',
            });
            return Buffer.from(res.data);
        } catch (err) {
            // @TODO implement logging
            // console.log(err);
            return null;
        }
    }
    // assets are located in the gen folder, because they are combined from the packages
    if (src.match(/^\/?assets\//)) {
        return read_buffer(join(Cwd.get(), 'gen', src));
    }
    // local file, somewhere in the project
    return read_buffer(join(Cwd.get(), src));
}
export function get_output(src) {
    return join(Cwd.get(), src);
}
export function correct_format(format, src) {
    if (!filled_string(format) || format == 'null') {
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
