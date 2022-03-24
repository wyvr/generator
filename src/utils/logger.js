import { is_string } from "./validate.js";

export class Logger {
    static unstyle(text) {
        if(!is_string(text)) {
            return '';
        }
        /* eslint-disable no-control-regex */
        // @see https://github.com/doowb/ansi-colors/blob/master/index.js ANSI_REGEX
        return text.replace(/[\u001b\u009b][[\]#;?()]*(?:(?:(?:[^\W_]*;?[^\W_]*)\u0007)|(?:(?:[0-9]{1,4}(;[0-9]{0,4})*)?[~0-9=<>cf-nqrtyA-PRZ]))/g, '');
        /* eslint-enable no-control-regex */
    }
}
