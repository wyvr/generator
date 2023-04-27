export function get_image_src_data(
    src,
    width,
    height = 0,
    mode = 'cover',
    quality = undefined,
    format = undefined,
    fixed = false,
    use_width = false,
    orig_width = undefined
) {
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
        format: 'jpeg',
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
    if (!format && extension && extension[1] != config.format) {
        format = extension[1];
    }
    if (format) {
        if (format == 'jpg') {
            format = 'jpeg';
        }
        config.format = format;
    }

    return { src, config, width_addition };
}
export function get_image_src_shortcode(src, config) {
    return `(media(src:'${src}', ${Object.entries(config)
        .map(([key, value]) => {
            return `${key}: ${typeof value == 'string' ? `'${value}'` : JSON.stringify(value)}`;
        })
        .join(', ')}))`;
}
export function get_image_src(src, config) {
    const hash = get_image_hash(JSON.stringify(config));

    if (src.indexOf('http') == 0) {
        const domain_match = src.match(/^https?:\/\/([^\/]*?)\//);
        if (domain_match) {
            const domain = domain_match[1];
            const domain_hash = get_image_hash(domain);
            if (domain_hash) {
                const src_path = src.substring(src.indexOf(domain) + domain.length).replace(/^\//, '');
                return `/media/_d/${domain_hash}/${hash}/${src_path}`;
            }
        }
    }
    return `/media/${hash}/${src.replace(/^\//, '')}${width_addition}`;
}
export function correct_image_format(format) {
    if (!format) {
        return null;
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
            return format;
    }
    return null;
}
export function get_image_hash(value) {
    return btoa(value);
}
