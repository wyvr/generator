import { Logger } from '../utils/logger.js';
import { search_segment } from '../utils/segment.js';
import { Cwd } from '../vars/cwd.js';
import { find_port } from '../utils/port.js';
import { get_report } from '../action/check_env.js';
import { exists } from '../utils/file.js';
import { lstatSync } from 'fs';
import { FOLDER_PUBLISH } from '../constants/folder.js';

export async function health_command(config) {
    const wyvr_version = search_segment(config, 'version', '');
    const node_version = process.versions.node;
    const cwd = Cwd.get();
    Logger.present('wyvr', wyvr_version);
    Logger.present('node', node_version);
    Logger.present('cwd', cwd);

    let success = true;

    const env_report = await get_report();

    if (env_report.info.length > 0) {
        env_report.info.forEach((msg) => {
            Logger.info(msg);
        });
    }
    if (env_report.warning.length > 0) {
        env_report.warning.forEach((msg) => {
            Logger.warning(msg);
        });
    }
    if (env_report.error.length > 0) {
        env_report.error.forEach((msg) => {
            Logger.error(msg);
        });
        success = false;
    }

    // check app port
    const defined_port = config?.cli?.flags?.port || 3000;
    const port = await find_port(defined_port);
    if (defined_port == port) {
        Logger.present('port', defined_port);
    } else {
        Logger.warning('port', defined_port, 'already in use');
    }

    // check ws port
    const defined_wsport = config?.cli?.flags?.wsport || 3001;
    const wsport = await find_port(defined_wsport);
    if (defined_wsport == wsport) {
        Logger.present('port', defined_wsport);
    } else {
        Logger.warning('port', defined_wsport, 'already in use');
    }

    const pub = Cwd.get(FOLDER_PUBLISH);
    if (exists(pub)) {
        if (!lstatSync(pub).isSymbolicLink()) {
            Logger.error(`pub ${pub} is not a symbolic link`);
            success = false;
        } else {
            Logger.present('pub', pub);
        }
    } else {
        Logger.warning('pub', pub, 'does not exist');
    }

    if (!success) {
        Logger.error('This project contains critical errors');
        process.exit(1);
    }
    return '';
}
