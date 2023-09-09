import { check_env } from '../action/check_env.js';
import { get_config_data } from '../action/get_config_data.js';
import { collect_packages } from '../action/package.js';
import { present } from '../action/present.js';
import { FOLDER_RELEASES } from '../constants/folder.js';
import { package_report } from '../presentation/package_report.js';
import { Config } from '../utils/config.js';
import { execute_cronjobs, filter_cronjobs } from '../utils/cron.js';
import { read_json } from '../utils/file.js';
import { clone } from '../utils/json.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { UniqId } from '../vars/uniq_id.js';
import { WorkerController } from '../worker/controller.js';

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

    if (Env.is_dev()) {
        Logger.warning('in dev environment no route results gets persisted');
    }

    await Plugin.initialize();

    // check for specific cron calls
    const all_cronjobs = Config.get('cron');
    const non_existing_cronjobs = [];
    const explicit_crons_requested = (config_data?.cli?.command || ['cron']).slice(1);
    const explicit_crons = explicit_crons_requested
        .map((name) => {
            const cron = clone(all_cronjobs[name]);
            if (!cron) {
                non_existing_cronjobs.push(name);
                return undefined;
            }
            cron.name = name;
            cron.failed = false;
            return cron;
        })
        .filter((x) => x);

    if (non_existing_cronjobs.length > 0) {
        Logger.warning('non existing cronjobs', non_existing_cronjobs.join(' '));
        if (explicit_crons_requested.length == non_existing_cronjobs.length) {
            Logger.warning('no cronjob has run successfully');
            return;
        }
    }

    await WorkerController.single_threaded();

    let cronjobs = [];
    if (explicit_crons.length > 0) {
        cronjobs = explicit_crons;
    } else {
        // filter out currently not running cronjobs
        cronjobs = filter_cronjobs(all_cronjobs);
    }
    if (cronjobs.length == 0) {
        Logger.warning('no cronjobs to run');
        return '-';
    }
    const executed_cronjobs = await execute_cronjobs(cronjobs);
    const successfull_cronjobs = executed_cronjobs.filter((cron) => {
        return cron && !cron.failed;
    });
    if (successfull_cronjobs.length == 0) {
        Logger.warning('no cronjob has run successfully');
        return '-';
    }
    return successfull_cronjobs.map((cron) => cron.name).join(' ');
}
