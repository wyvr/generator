import { join } from 'path';
import { terminate } from '../cli/terminate.js';
import { ERRORS } from '../constants/errors.js';
import { env_report } from '../presentation/env_report.js';
import { is_file, read_json } from '../utils/file.js';
import { to_dirname } from '../utils/to.js';
import { Cwd } from '../vars/cwd.js';

export async function check_env() {
    const check_env_report = await get_report();
    // execution can end here when environment is not correct
    env_report(check_env_report);
    terminate(!check_env_report || !check_env_report.success);
}
export async function get_report() {
    const report = {
        success: true,
        info: [],
        warning: [],
        error: [],
    };

    // wyvr root path
    const __dirname = join(to_dirname(import.meta.url), '..', '..');

    // check if project is the wyvr root path
    if (Cwd.get() == __dirname) {
        report.success = false;
        report.error.push(ERRORS.run_in_same_folder);
    }

    // check if a package.json is present
    const package_json_path = Cwd.get('package.json');
    if(!is_file(package_json_path)) {
        report.warning.push(ERRORS.package_is_not_present);
    } else {
        if(!read_json(package_json_path)) {
            report.warning.push(ERRORS.package_is_not_valid);
        }
    }
    
    // check if a wyvr.js is present
    const wyvr_js_path = Cwd.get('wyvr.js');
    if(!is_file(wyvr_js_path)) {
        report.success = false;
        report.error.push(ERRORS.wyvr_js_is_not_present);
    }

    return report;
}

