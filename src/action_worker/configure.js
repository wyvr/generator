import { Config } from '../utils/config.js';
import { Logger } from '../utils/logger.js';
import { filled_object } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { Report } from '../vars/report.js';
import { UniqId } from '../vars/uniq_id.js';
import { WyvrPath } from '../vars/wyvr_path.js';

export async function configure(data) {
    if (!filled_object(data)) {
        Logger.error('empty configure data');
        return false;
    }
    let set = false;
    if (data.config) {
        Config.replace(data.config);
        set = true;
    }
    if (data.env) {
        Env.set(data.env);
        set = true;
    }
    if (data.cwd) {
        Cwd.set(data.cwd);
        set = true;
    }
    if (data.release_path) {
        ReleasePath.set(data.release_path);
        set = true;
    }
    if (data.wyvr_path) {
        WyvrPath.set(data.wyvr_path);
        set = true;
    }
    if (data.uniq_id) {
        UniqId.set(data.uniq_id);
        set = true;
    }
    if (data.report) {
        Report.set(data.report);
        set = true;
    }

    return set;
}
