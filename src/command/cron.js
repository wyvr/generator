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
    if (!build_id) {
        Logger.error('no id available in', UniqId.file());
        return;
    }
    UniqId.set(build_id);

    ReleasePath.set(Cwd.get(FOLDER_RELEASES, UniqId.get()));

    const config_data = get_config_data(config, build_id);
    present(config_data);

    // Collect packages
    const package_json = read_json('package.json');
    const { available_packages, disabled_packages } = await collect_packages(package_json, false);
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
        if (explicit_crons_requested.length === non_existing_cronjobs.length) {
            Logger.warning('no cronjob has run successfully');
            return;
        }
    }

    // list cron jobs
    if (config_data?.cli?.flags?.list) {
        Logger.raw_log('');
        Logger.present('List of all cronjobs');

        const found_cron_names = explicit_crons.map((cron) => cron.name);
        for (const name of Object.keys(all_cronjobs)) {
            const when = all_cronjobs[name]?.when ?? 'disabled';
            const when_colored = when === 'disabled' ? Logger.color.red(when) : when.indexOf('@') === 0 ? Logger.color.yellow(when) : Logger.color.green(when);
            if (found_cron_names.indexOf(name) > -1) {
                Logger.raw_log(Logger.color.green('  *'), Logger.color.green(name), when_colored);
            } else {
                Logger.raw_log('   ', name, when_colored);
            }
        }
        Logger.raw_log('');

        return found_cron_names.join(' ');
    }

    await WorkerController.single_threaded();

    let cronjobs = [];
    if (explicit_crons.length > 0) {
        cronjobs = explicit_crons;
    } else {
        // filter out currently not running cronjobs
        cronjobs = filter_cronjobs(all_cronjobs);
    }
    if (cronjobs.length === 0) {
        Logger.warning('no cronjobs to run');
        return '-';
    }
    const executed_cronjobs = await execute_cronjobs(cronjobs);
    const successfull_cronjobs = executed_cronjobs.filter((cron) => {
        return cron && !cron.failed;
    });
    if (successfull_cronjobs.length === 0) {
        Logger.warning('no cronjob has run successfully');
        return '-';
    }
    const result = successfull_cronjobs.map((cron) => cron.name).join(', ');
    Logger.success('succeeded cronjobs', result);
    return result;
}
