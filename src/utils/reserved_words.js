import { Logger } from "./logger.js";
import { is_string } from "./validate.js";

export function contains_reserved_words(value) {
    if(!is_string(value)) {
        return false;
    }
    return !!value.match(/^\/?(?:assets|css|devtools|i18n|js|media)\//);
}
export function is_path_valid(value) {
    if(!is_string(value)) {
        return true;
    }
    const contains = contains_reserved_words(value);
    if(contains) {
        Logger.error('path', value, 'contains reserved words');
    }
    return !contains;
}