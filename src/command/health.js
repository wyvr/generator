import { Logger } from '../utils/logger.js';
import { search_segment } from '../utils/segment.js';
import { Cwd } from '../vars/cwd.js';
import { find_port } from '../utils/port.js';
import { get_report } from '../action/check_env.js';
import { FOLDER_PUBLISH } from '../constants/folder.js';
import { is_pub_valid } from '../utils/health.js';

export async function health_command(config) {
    const wyvr_version = search_segment(config, 'version', '');
    const node_version = process.versions.node;
    const cwd = Cwd.get();
    Logger.present('wyvr', wyvr_version);
    Logger.present('node', node_version);
    Logger.present('cwd', cwd);

    let success = true;

    const env_report = await get_report();
    for (const type of ['info', 'warning', 'error']) {
        if (env_report[type]?.length > 0) {
            for (const msg of env_report[type]) {
                Logger[type](msg);
            }
            if (type === 'error') {
                success = false;
            }
        }
    }

    // check app port
    const defined_port = config?.cli?.flags?.port || 3000;
    const port = await find_port(defined_port);
    if (defined_port === port) {
        Logger.present('port', defined_port);
    } else {
        Logger.warning('port', defined_port, 'already in use, maybe you have another instance of wyvr running');
    }

    // check ws port
    const defined_wsport = config?.cli?.flags?.wsport || 3001;
    const wsport = await find_port(defined_wsport);
    if (defined_wsport === wsport) {
        Logger.present('port', defined_wsport);
    } else {
        Logger.warning('port', defined_wsport, 'already in use, maybe you have another instance of wyvr running');
    }

    const pub = Cwd.get(FOLDER_PUBLISH);
    if (is_pub_valid()) {
        Logger.present('pub', pub);
    } else {
        Logger.warning('pub', pub, 'does not exist');
    }

    if (!success) {
        Logger.error('This project contains critical errors');
        process.exit(1);
    }
    return '';
}
