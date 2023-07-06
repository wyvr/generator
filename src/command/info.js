import { get_config_data } from '../action/get_config_data.js';
import { Logger } from '../utils/logger.js';
import { search_segment } from '../utils/segment.js';
import { Cwd } from '../vars/cwd.js';

export async function info_command(config) {
    get_config_data(config);
    const wyvr_version = search_segment(config, 'version', '');
    const node_version = process.versions.node;
    const cwd = Cwd.get();
    Logger.present('wyvr', wyvr_version);
    Logger.present('node', node_version);
    Logger.present('cwd', cwd);
    return '';
}
