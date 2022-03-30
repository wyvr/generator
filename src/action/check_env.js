import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { ERRORS } from '../constants/errors.js';
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

    return report;
}
