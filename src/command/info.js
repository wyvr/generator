import { get_config_data } from '../action/get_config_data.js';
import { Logger } from '../utils/logger.js';
import { search_segment } from '../utils/segment.js';
import { UniqId } from '../vars/uniq_id.js';

export async function info_command(config) {
    get_config_data(config);
    const wyvr_version = search_segment(config, 'version', '');
    const node_version = process.versions.node;
    Logger.present('wyvr', wyvr_version);
    if (process.versions.bun) {
        Logger.present('bun', process.versions.bun);
    }
    Logger.present('node', node_version);
    Logger.present('id', UniqId.load());
    if (config?.cli?.flags?.config) {
        for (const key of Object.keys(config).sort()) {
            if (['cli', 'version', 'build_id', '_secrets'].includes(key)) {
                continue;
            }
            Logger.present(key, JSON.stringify(config[key], null, 4));
        }
    } else {
        Logger.present('cwd', JSON.stringify(config?.cwd, null, 4));
    }
    return '';
}
