import { dirname, extname } from 'path';
import replaceAsync from 'string-replace-async';
import { FOLDER_GEN, FOLDER_MEDIA } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { create_dir, exists, is_file, read_buffer, to_extension, write } from './file.js';
import { filled_string, in_array, match_interface } from './validate.js';
import sharp from 'sharp';
import { MediaModel } from '../model/media.js';
import { Logger } from './logger.js';
import { get_error_message } from './error.js';
import { MediaModelMode, MediaModelOutput } from '../struc/media.js';
import https from 'https';
import { Plugin } from './plugin.js';
import { create_hash } from './hash.js';
import { Config } from './config.js';
import { get_config_cache, set_config_cache } from './config_cache.js';
import { IsWorker } from '../vars/is_worker.js';
import { to_media_config, to_media_hash } from '../boilerplate/src/wyvr/media.js';

let cache;
export function build_cache() {
    // workers are only allowed to load the cache
    if (IsWorker.get()) {
        const load_cache = get_config_cache('media.domain_cache', {});
        cache = load_cache;
        return;
    }
    const allowed_domains = Config.get('media.allowed_domains', {});
    // the main allways generates the cache
    cache = {};
    Object.values(allowed_domains).forEach((domain) => {
        // create short hash of the domain
        const clean_domain = domain.replace(/\/$/, '');
        const hash = get_domain_hash(clean_domain);
        cache[hash] = clean_domain;
    });
    set_config_cache('media.domain_cache', cache, false);
}
export function clear_cache() {
    cache = undefined;
    cache_keys = undefined;
}

export function get_domain_hash(domain) {
    return create_hash(domain, 8);
}

export function get_cache(hash) {
    if (!cache) {
        build_cache();
    }
    return cache[hash];
}

let cache_keys;
export function get_cache_keys() {
    if (cache_keys) {
        return cache_keys;
    }
    const allowed_domains = Config.get('media.allowed_domains', {});
    const result = {};
    Object.entries(allowed_domains).forEach(([key, domain]) => {
        const hash = get_domain_hash(domain);
        result[key] = {
            hash,
            domain,
        };
    });
    cache_keys = result;
    return result;
}

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
    const real_ext = extname(media.src)?.toLowerCase().replace(/^\./, '');
    if (!real_ext) {
        return undefined;
    }
    // unknown extensions will not be processed, inclusive svg, because it is text
    if (!in_array(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'ico'], real_ext)) {
        write(output, Buffer.from(buffer));

        return undefined;
    }
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
    try {
        write(output, Buffer.from(output_buffer));
    } catch (e) {
        Logger.error(get_error_message(e, media.src, 'save media'));
    }

    return undefined;
}

export async function config_from_url(url) {
    if (!filled_string(url)) {
        return undefined;
    }
    if (url.indexOf('/media/') !== 0) {
        return undefined;
    }
    const clean_url = url.replace(/\?.*$/, '').replace(/#.*$/, '');

    let media_model = { result: clean_url, result_exists: exists(Cwd.get(clean_url)), output: MediaModelOutput.path };

    const contains_domain = clean_url.indexOf('/media/_d') === 0;

    // get the hashes and values from the url
    let groups;
    let media_scope = 'local';
    if (contains_domain) {
        groups = clean_url.match(/^\/media\/_d\/(?<domain_hash>[^/]+)\/(?<config_hash>[^/]+)\/(?<rel_path>.*)/)?.groups;
        if (!groups?.domain_hash) {
            return undefined;
        }
        // check if the domain is in the cache
        const domain = get_cache(groups.domain_hash);
        if (!domain) {
            Logger.warning('unknown domain, hash', groups.domain_hash);
            return undefined;
        }
        media_model.domain = domain;
        media_scope = domain.replace(/^https?:\/\//, '');
    } else {
        groups = clean_url.match(/^\/media\/(?<config_hash>[^/]+)\/(?<rel_path>.*)/)?.groups;
    }
    if (!groups) {
        return undefined;
    }

    // get the relative path to the domain or cwd for local
    if (!groups?.rel_path) {
        Logger.error('media missing rel_path', clean_url);
        return undefined;
    }

    media_model.src = groups.rel_path;
    if (contains_domain) {
        media_model.src = `${media_model.domain}/${groups.rel_path.replace(/^\//, '')}`;
    }

    // extract the config
    try {
        const config_string = Buffer.from(groups.config_hash, 'base64').toString('ascii');
        media_model = Object.assign(media_model, to_media_config(config_string));
        media_model.format = correct_format(media_model.format, groups.rel_path);
    } catch (e) {
        Logger.error(get_error_message(e, clean_url, `media config, ${media_scope}`));
    }

    // correct the src
    if (media_model.ext && media_model.ext != media_model.format) {
        media_model.src = media_model.src.replace(new RegExp(`.${media_model.format}$`), `.${media_model.ext}`);
    }

    const result = new MediaModel(media_model);

    const media_config = await Plugin.process('media_config', result);
    const media_config_result = await media_config((result) => result);
    return media_config_result.result;
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
    return get_config_with_results(config);
}

export function get_config_with_results(config) {
    if (!filled_string(config.src)) {
        return config;
    }
    // convert to correct format
    let src = config.src.replace(/\?.*$/, '').replace(/#.*$/, '');
    let rel_path = to_extension(src, config.format);
    // create config hash to group different images together
    const config_hash = get_config_hash(config);
    // try load domain to get the hash
    config.hash = config_hash;
    let domain = null;
    if (src.indexOf('http') == 0) {
        const domain_match = src.match(/^(?<domain>https?:\/\/[^/]*?)\//)?.groups?.domain;
        if (domain_match) {
            domain = get_domain_hash(domain_match);
            rel_path = src.substring(domain_match.length).replace(/^\//, '');
        }
    }
    if (config.domain) {
        domain = get_domain_hash(config.domain);
    }
    // build the url
    if (domain) {
        config.result = `/${FOLDER_MEDIA}/_d/${domain}/${config_hash}/${rel_path}`;
    } else {
        config.result = `/${FOLDER_MEDIA}/${config_hash}/${rel_path}`;
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
    const hash = to_media_hash(config);
    if (!hash) {
        return '_';
    }
    return get_hash(hash);
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
