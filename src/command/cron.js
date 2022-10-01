import { check_env } from '../action/check_env.js';
import { get_config_data } from '../action/get_config_data.js';
import { collect_packages } from '../action/package.js';
import { present } from '../action/present.js';
import { FOLDER_GEN_CRON, FOLDER_RELEASES } from '../constants/folder.js';
import { package_report } from '../presentation/package_report.js';
import { Config } from '../utils/config.js';
import { filter_cronjobs } from '../utils/cron.js';
import { get_error_message } from '../utils/error.js';
import { read_json } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { UniqId } from '../vars/uniq_id.js';

export async function cron_command(config) {
    await check_env();

    const build_id = UniqId.load();
    UniqId.set(build_id || UniqId.get());
    ReleasePath.set(Cwd.get(FOLDER_RELEASES, UniqId.get()));

    const config_data = get_config_data(config, build_id);
    present(config_data);

    // Collect packages
    const package_json = read_json('package.json');
    const { available_packages, disabled_packages } = await collect_packages(package_json);
    package_report(available_packages, disabled_packages);

    let cronjobs = filter_cronjobs(Config.get('cron'));
    if (cronjobs.length == 0) {
        Logger.warning('no cronjobs to run');
        return '-';
    }
    await Promise.all(
        cronjobs.map(async (job, index) => {
            const path = Cwd.get(FOLDER_GEN_CRON, job.what);
            let result = true;
            Logger.block('cron job', job.name);
            try {
                result = (await import(path)).default(job.options);
            } catch (e) {
                Logger.error(get_error_message(e, path, 'cron'));
                cronjobs[index].failed = true;
            }
            return result;
        })
    );
    cronjobs = cronjobs.filter((cron) => {
        return cron && !cron.failed;
    });
    if (cronjobs.length == 0) {
        Logger.warning('no cronjob has run successfully');
        return '-';
    }
    return cronjobs.map((cron) => cron.name).join(' ');
}
