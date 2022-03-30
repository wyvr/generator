import { ERRORS } from '../constants/errors.js';
import { Logger } from '../utils/logger.js';
import { is_array } from '../utils/validate.js';

export function env_report(report) {
    if (!report) {
        Logger.error(ERRORS.missing('report'));
        process.exit(1);
        return;
    }
    if (is_array(report.info)) {
        report.info.forEach((info) => {
            Logger.info(info);
        });
    }
    if (is_array(report.warning)) {
        report.warning.forEach((warning) => {
            Logger.warning(warning);
        });
    }
    if (is_array(report.error)) {
        report.error.forEach((error) => {
            Logger.error(error);
        });
    }

    if (!report.success) {
        Logger.error(ERRORS.critical);
        process.exit(1);
        return;
    }
}
