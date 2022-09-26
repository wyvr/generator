import { check_env } from '../action/check_env.js';
import { get_config_data } from '../action/get_config_data.js';
import { collect_packages } from '../action/package.js';
import { present } from '../action/present.js';
import { package_report } from '../presentation/package_report.js';
import { Config } from '../utils/config.js';
import { read_json } from '../utils/file.js';
import { UniqId } from '../vars/uniq_id.js';

export async function cron_command(config) {
    await check_env();

    const build_id = UniqId.load();
    UniqId.set(build_id || UniqId.get());

    const config_data = get_config_data(config, build_id);
    present(config_data);

    // Collect packages
    const package_json = read_json('package.json');
    const { available_packages, disabled_packages } = await collect_packages(package_json);
    package_report(available_packages, disabled_packages);

    console.log(Config.get())

    return build_id;
}
