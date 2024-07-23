import { generate } from 'critical';
import { ReleasePath } from '../vars/release_path.js';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string, is_null } from './validate.js';
import { Config } from './config.js';

const critical_options = {
    // default options
    ...{
        dimensions: [
            { width: 320, height: 568 },
            { width: 360, height: 720 },
            { width: 480, height: 800 },
            { width: 1024, height: 768 },
            { width: 1280, height: 1024 },
            { width: 1920, height: 1080 },
        ],
    },
    // project settings
    ...Config.get('critical', {}),
};

export async function get_critical_css(content, file) {
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
    if (!filled_string(content)) {
        return undefined;
    }
    try {
        const options = {
            ...critical_options,
            ...{
                inline: false, // generates CSS
                base: ReleasePath.get(),
                html: content,
            },
        };
        // create above the fold inline css
        const result = await generate(options);
        return result;
    } catch (e) {
        Logger.error(get_error_message(e, file, 'critical'));
    }
    return undefined;
}
