import { Logger } from '../utils/logger.js';
import { show_help } from './available_commands.js';

export async function help_command() {
    show_help({
        flags: true
    });
    Logger.info('visit https://wyvr.dev for more infos');
    return '';
}
