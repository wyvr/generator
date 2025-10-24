import { generate } from 'critical';
import { ReleasePath } from '../vars/release_path.js';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string, is_null } from './validate.js';
import { Config } from './config.js';
import { KeyValue } from './database/key_value.js';
import { STORAGE_OPTIMIZE_CRITICAL } from '../constants/storage.js';

const enabled = Config.get('critical.active', true);

const critical_options = {
    // default options
    ...{
        dimensions: [
            { width: 320, height: 568 },
            { width: 360, height: 720 },
            { width: 480, height: 800 },
            { width: 1024, height: 768 },
            { width: 1280, height: 1024 },
            { width: 1920, height: 1080 }
        ],
        rebase: false
    },
    // project settings
    ...Config.get('critical', {})
};

export async function get_critical_css(content, file) {
    if (!enabled) {
        return '';
    }
    const result = await generate_critical_css(content, file);
    if (is_null(result)) {
        return '';
    }
    if (result.css) {
        return result.css;
    }
    return '';
}

export async function generate_critical_css(content, file) {
    if (!enabled) {
        return undefined;
    }
    if (!filled_string(content)) {
        return undefined;
    }
    try {
        const options = {
            ...critical_options,
            ...{
                inline: false, // generates CSS
                base: ReleasePath.get(),
                html: content
            }
        };
        // create above the fold inline css
        const result = await generate(options);
        return result;
    } catch (e) {
        Logger.error(get_error_message(e, file, 'critical'));
    }
    return undefined;
}

const critical_db = new KeyValue(STORAGE_OPTIMIZE_CRITICAL);

export function insert_critical_css(content, identifier) {
    if (!enabled || !filled_string(content) || !filled_string(identifier)) {
        return content;
    }

    const css = critical_db.get(identifier)?.css;
    if (!css) {
        return content;
    }
    return content.replace('</head>', `<style id="critical">${css}</style></head>`);
}

export function critical_css_exists(identifier) {
    if (!enabled) {
        return false;
    }
    return critical_db.exists(identifier);
}

export function critical_css_set(identifier, css, files) {
    return critical_db.set(identifier, {
        css,
        files
    });
}
