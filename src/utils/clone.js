import { Logger } from './logger.js';

export function clone(item) {
    try {
        return JSON.parse(JSON.stringify(item));
    } catch (e) {
        Logger.error('error cloning object', e);
        return undefined;
    }
}
