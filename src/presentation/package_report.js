import { Logger } from '../utils/logger.js';
import { filled_array } from '../utils/validate.js';

export function package_report(available_packages, disabled_packages) {
    // list available packages
    if (filled_array(available_packages)) {
        Logger.present('packages', available_packages.map((pkg) => `${pkg.name}`).join(', '));
    } else {
        Logger.error('no packages active');
        process.exit(1);
    }
    // list disabled packages
    if (filled_array(disabled_packages)) {
        Logger.warning('disabled packages', disabled_packages.map((pkg) => `${pkg.name}`).join(', '));
    }
}
