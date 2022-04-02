import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { ERRORS } from '../constants/errors.js';
import { is_file, read_json } from '../utils/file.js';
import { Cwd } from '../vars/cwd.js';

export async function check_env() {
    const report = {
        success: true,
        info: [],
        warning: [],
        error: [],
    };

    // wyvr root path
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url), '..', '..')));

    // check if project is the wyvr root path
    if (Cwd.get() == __dirname) {
        report.success = false;
        report.error.push(ERRORS.run_in_same_folder);
    }

    // check if a package.json is present
    const package_json_path = join(Cwd.get(), 'package.json');
    if(!is_file(package_json_path)) {
        report.warning.push(ERRORS.package_is_not_present);
    } else {
        if(!read_json(package_json_path)) {
            report.warning.push(ERRORS.package_is_not_valid);
        }
    }
    
    // check if a wyvr.js is present
    const wyvr_js_path = join(Cwd.get(), 'wyvr.js');
    if(!is_file(wyvr_js_path)) {
        report.success = false;
        report.error.push(ERRORS.wyvr_js_is_not_present);
    }

    return report;
}
