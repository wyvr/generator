import { Config } from '../utils/config.js';
import { Logger } from '../utils/logger.js';
import { match_interface } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { Report } from '../vars/report.js';
import { UniqId } from '../vars/uniq_id.js';
import { WyvrPath } from '../vars/wyvr_path.js';

const configure_interface = {
    config: true,
    env: true,
    cwd: true,
    release_path: true,
    wyvr_path: true,
    uniq_id: true,
    report: true,
};

export async function configure(data) {
    if (!match_interface(data, configure_interface)) {
        Logger.error('invalid config', data);
        return false;
    }

    Config.replace(data.config);
    Env.set(data.env);
    Cwd.set(data.cwd);
    ReleasePath.set(data.release_path);
    WyvrPath.set(data.wyvr_path);
    UniqId.set(data.uniq_id);
    Report.set(data.report);

    return true;


    // export const configure = (config: IWorkerConfigureValue | null) => {
    //     if (!config) {
    //         Logger.warning('empty configure value');
    //         return null;
    //     }
    //     // set the config of the worker by the main process
    //     Env.set(config?.env);
    //     Cwd.set(config?.cwd);
    //     ReleasePath.set(config?.release_path);
    //     // only when everything is configured set the worker idle
    //     if (Env.get() == null || Cwd.get() == null || ReleasePath.get() == null) {
    //         Logger.warning('invalid configure value', config);
    //         return null;
    //     }
    //     return { root_template_paths: RootTemplatePaths.get(), socket_port: config?.socket_port };
    // };
}
