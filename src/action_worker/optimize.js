import { filled_array } from '../utils/validate.js';
import { read, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { extname } from 'node:path';

import { get_error_message } from '../utils/error.js';
import { ReleasePath } from '../vars/release_path.js';
import { KeyValue } from '../utils/database/key_value.js';
import { STORAGE_OPTIMIZE_CRITICAL } from '../constants/storage.js';
import { optimize_content } from '../utils/optimize.js';
import { optimize_css } from '../utils/optimize/css.js';
import { optimize_js } from '../utils/optimize/js.js';

const critical_db = new KeyValue(STORAGE_OPTIMIZE_CRITICAL);
export async function optimize(files) {
    if (!filled_array(files)) {
        return false;
    }

    for (const file of files) {
        try {
            let content = read(file);
            if (!content) {
                content = '';
            }

            const rel_path = file.replace(ReleasePath.get(), '');

            switch (extname(file)) {
                case '.css': {
                    await optimize_css(content, rel_path);
                    break;
                }
                case '.cjs':
                case '.mjs':
                case '.js': {
                    await optimize_js(content, rel_path);
                    break;
                }
            }
        } catch (e) {
            Logger.error(get_error_message(e, file, 'optimize'));
        }
    }
    return true;
}
