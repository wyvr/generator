import { to_media_hash } from '$src/wyvr/media.js';

export function get_image_src_data(src, width, height = 0, mode = 'cover', quality = undefined, format = undefined, fixed = false, use_width = false, orig_width = undefined) {
    if (Array.isArray(src)) {
        src = src
            .filter((x) => x)
            .join('/')
            .replace(/^(https?):\/([^\/])/, '$1://$2');
    }
    if (!src) {
        return undefined;
    }
    let src_height = '';
    const width_addition = use_width ? ` ${width}w` : '';
    if (height > 0) {
        if (fixed) {
            src_height = height;
        } else {
            if (orig_width) {
                src_height = (height / orig_width) * width;
            }
        }
    }

    const config = {
        mode: 'cover',
        format: 'jpeg'
    };
    if (width) {
        config.width = width;
    }
    if (height > 0) {
        config.height = src_height;
    }
    if (quality) {
        config.quality = quality;
    }
    if (mode) {
        config.mode = mode;
    }
    const extension = src.match(/\.([^\.]+)$/);
    if (extension) {
        config.ext = extension[1];
    }
    if (!format && config.ext) {
        format = config.ext;
    }
    if (format) {
        config.format = correct_image_format(format);
    }

    return { src, config: to_media_hash(config), width_addition };
}
export function order_config(config) {
    const ordered = {};
    ['ext', 'format', 'height', 'mode', 'quality', 'width'].forEach((key) => {
        if (config[key] != null) {
            ordered[key] = config[key];
        }
    });
    return ordered;
}
// @TODO check if obsolete
export function get_image_src_shortcode(src, config) {
    const result = `(media(src:'${src}', ${Object.entries(config)
        .map(([key, value]) => {
            return `${key}: ${typeof value == 'string' ? `'${value}'` : JSON.stringify(value)}`;
        })
        .join(', ')}))`;
    return result;
}
export function get_image_src(src, config, domain = undefined) {
    let hash = typeof config == 'string' ? config : to_media_hash(config);
    if (!hash) {
        hash = '_';
    } else {
        if (typeof btoa == 'function') {
            hash = btoa(hash);
        } else {
            hash = Buffer.from(hash).toString('base64');
        }
    }

    if (src.indexOf('http') == 0) {
        const domain_match = src.match(/^https?:\/\/([^\/]*?)\//);
        if (domain_match) {
            const domain = domain_match[1];
            const domain_hash = get_image_hash(domain); // buggy
            if (domain_hash) {
                let src_path = src.substring(src.indexOf(domain) + domain.length).replace(/^\//, '');
                if (config.ext) {
                    src_path = src_path.replace(new RegExp(`.${config.ext}$`), `.${config.format}`);
                }
                return `/media/_d/${domain_hash}/${hash}/${src_path}`;
            }
        }
    }
    if (domain) {
        return `/media/_d/${domain}/${hash}/${src.replace(/^\//, '')}`;
    }
    return `/media/${hash}/${src.replace(/^\//, '')}`;
}
export function correct_image_format(format, src) {
    if (!format) {
        if (!src) {
            return null;
        }
        const src_format = src.match(/\.(?<format>[^./]*?)$/)?.groups?.format;
        if (!src_format) {
            return null;
        }
        format = src_format;
    }
    format = format.toLowerCase();
    switch (format) {
        case 'jpg':
            return 'jpeg';
        case 'gif':
        case 'png':
        case 'jpeg':
        case 'webp':
        case 'avif':
        case 'heif':
        case 'svg':
            return format;
    }
    return null;
}
export function get_image_hash(value) {
    return btoa(value);
}
