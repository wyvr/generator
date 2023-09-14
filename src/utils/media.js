import { dirname } from 'path';
import replaceAsync from 'string-replace-async';
import { FOLDER_GEN, FOLDER_MEDIA } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { create_dir, exists, is_file, read_buffer, to_extension, write } from './file.js';
import { filled_object, filled_string, in_array, is_object, match_interface } from './validate.js';
import sharp from 'sharp';
import { MediaModel } from '../model/media.js';
import { Logger } from './logger.js';
import { get_error_message } from './error.js';
import { MediaModelMode, MediaModelOutput } from '../struc/media.js';
import { clone } from './json.js';
import https from 'https';
import { Plugin } from './plugin.js';

export async function process(media) {
    if (!match_interface(media, { src: true, result: true })) {
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
    if (in_array(['jpg', 'jpe', 'jpeg'], media.format) && media.mode != MediaModelMode.cover) {
        options.background = { r: 255, g: 255, b: 255 };
    }
    Logger.debug(media.src, JSON.stringify(options));
    let modified_image;
    try {
        modified_image = await sharp(buffer).pipelineColourspace('rgb16').resize(options);
    } catch (e) {
        Logger.error(get_error_message(e, media.src, 'sharp'));
        return undefined;
    }
    if (media.output != MediaModelOutput.path) {
        Logger.warning(
            'media',
            `${media.src} output "${media.output}" is not implemented at the moment, falling back to path`
        );
    }
    let output_buffer;
    switch (media.format) {
        case 'jpg':
        case 'jpe':
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
            /* @TODO sharp does not provide a method to get the gamma value of an image,
             * some systems add a wrong gamma value to it,
             * the solution for this images wolud be `.gamma(1, 2.2)`,
             * but can not be applied to all png images, because most get to bright because of this correction
             */
            output_buffer = await modified_image.gamma().png().toBuffer();
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

    return undefined;
}

export async function config_from_url(url) {
    if (!filled_string(url)) {
        return undefined;
    }
    const matches = url.match(/^\/media\/([^/]+)\/(.*)/);
    if (!matches) {
        return undefined;
    }

    let result = clone(new MediaModel({}));
    // check for domain matches
    if (matches[1] == '_d') {
        const domain_matches = matches[2].match(/^([^/]+)\/([^/]+)\/(.*)/);
        if (!domain_matches) {
            return undefined;
        }
        try {
            const config_string = Buffer.from(domain_matches[2], 'base64').toString('ascii');
            result = JSON.parse(config_string);
            result.format = correct_format(result.format, url);
        } catch (e) {
            Logger.error(get_error_message(e, domain_matches[3], 'media on demand'));
        }
        result.domain = Buffer.from(domain_matches[1], 'base64').toString('ascii');
        result.src = `https://${result.domain}/${domain_matches[3]}`;
        if (result.ext) {
            result.src = result.src.replace(new RegExp(`.${result.format}$`), `.${result.ext}`);
        }
        result.result = url;
        result.result_exists = exists(Cwd.get(result.result));
        result.output = MediaModelOutput.path;
        const media_config = await Plugin.process('media_config', result);
        const media_config_result = await media_config((result) => result);
        return media_config_result.result;
    }
    // extract local file
    try {
        const config_string = Buffer.from(matches[1], 'base64').toString('ascii');
        result = JSON.parse(config_string);
        result.format = correct_format(result.format, url);
    } catch (e) {
        Logger.error(get_error_message(e, matches[2], 'media on demand'));
    }
    if (!result.src) {
        result.src = matches[2];
    }
    result.result = url;
    result.result_exists = exists(Cwd.get(result.result));
    result.output = MediaModelOutput.path;

    return result;
}

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
    if (!filled_string(config.src)) {
        return config;
    }
    // convert to correct format
    let src = config.src;
    let mod_src = to_extension(src, config.format);
    // create config hash to group different images together
    const hash = get_config_hash(config);
    config.hash = hash;
    let domain = null;
    if (src.indexOf('http') == 0) {
        const domain_match = mod_src.match(/^https?:\/\/([^/]*?)\//);
        if (domain_match) {
            domain = get_hash(domain_match[1]);
            mod_src = mod_src.substring(src.indexOf(domain_match[1]) + domain_match[1].length).replace(/^\//, '');
        }
    }
    if (domain) {
        config.result = `/${FOLDER_MEDIA}/_d/${domain}/${hash}/${mod_src}`;
    } else {
        config.result = `/${FOLDER_MEDIA}/${hash}/${mod_src}`;
    }
    // return the newly combined path
    return config;
}

export function get_config_from_content(content) {
    if (!filled_string(content)) {
        return undefined;
    }
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
    if (!is_object(config)) {
        return 'undefined';
    }
    ['ext', 'format', 'height', 'mode', 'quality', 'width'].forEach((key) => {
        if (config[key]) {
            hash_config[key] = config[key];
        }
    });
    if (!filled_object(hash_config)) {
        return 'empty';
    }
    return get_hash(JSON.stringify(hash_config));
}
export function get_hash(value) {
    if (!filled_string(value)) {
        return 'undefined';
    }
    return Buffer.from(value).toString('base64');
}
export async function get_buffer(src) {
    if (!filled_string(src)) {
        return undefined;
    }
    // download the image and return buffer from it
    if (src.indexOf('http') == 0) {
        try {
            const agent = new https.Agent({ rejectUnauthorized: false });
            return new Promise((resolve, reject) => {
                https
                    .get(src, { agent }, (res) => {
                        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 400) {
                            resolve(undefined);
                            return;
                        }
                        if (res.statusCode >= 300 && res.statusCode < 400) {
                            if (!res.headers.location) {
                                resolve(undefined);
                                return;
                            }
                            get_buffer(res.headers.location).then((result) => resolve(result));
                        }
                        const arrayBuffer = [];
                        res.on('data', (chunk) => {
                            arrayBuffer.push(chunk);
                        });
                        res.on('end', () => {
                            resolve(Buffer.concat(arrayBuffer));
                        });
                    })
                    .on('error', (err) => {
                        reject(err);
                    });
            });
        } catch (err) {
            Logger.error(get_error_message(err, src, 'media get_buffer'));
            return undefined;
        }
    }
    // assets are located in the gen folder, because they are combined from the packages
    if (src.match(/^\/?assets\//)) {
        return read_buffer(Cwd.get(FOLDER_GEN, src));
    }
    // local file, somewhere in the project
    return read_buffer(Cwd.get(src));
}
export function get_output(src) {
    return Cwd.get(src);
}
export function correct_format(format, src) {
    if (format == 'null') {
        format = undefined;
    }
    if (!filled_string(format) && filled_string(src)) {
        const ext_match = src.match(/\.([^.]+)$/);
        if (ext_match) {
            format = ext_match[1];
        }
    }
    if (format == 'jpg') {
        return 'jpeg';
    }
    if (!filled_string(format)) {
        return undefined;
    }
    return format;
}
