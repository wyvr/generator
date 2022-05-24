import { Logger } from '../utils/logger.js';

export async function sleep() {
    Logger.info('sleep 2s');
    await new Promise((r) => setTimeout(r, 2000));
}
