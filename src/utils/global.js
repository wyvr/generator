import { Config } from './config.js';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { is_func, is_null } from './validate.js';

export function register_inject_config() {
    // replace the injectConfig functions with the corresponding values
    if (!is_func(global.injectConfig)) {
        global.injectConfig = async (key, fallback, callback) => {
            let value = await Config.get(key, is_null(fallback) ? undefined : fallback);
            console.log(key, value, is_func(callback));
            if (!is_func(callback)) {
                return value;
            }
            try {
                value = await callback(value);
            } catch (e) {
                Logger.warning(get_error_message(e, 'injectConfig', 'injectConfig'));
            }
            return value;
        };
    }
}
