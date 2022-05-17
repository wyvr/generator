import { EnvType } from '../struc/env.js';
import { Config } from '../utils/config.js';
import { Logger } from '../utils/logger.js';
import { is_object } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';

export function get_config_data(cli_config, build_id) {
    const config = Config.get();
    if (is_object(cli_config)) {
        Object.keys(cli_config).forEach((key) => {
            config[key] = cli_config[key];
        });
    }
    if (is_object(cli_config?.cli?.flags)) {
        if (cli_config.cli.flags.dev) {
            Env.set(EnvType.dev);
        }
        if (cli_config.cli.flags.debug) {
            Env.set(EnvType.debug);
        }
        if (cli_config.cli.flags.plain) {
            Logger.remove_color = true;
            Logger.spinner.remove_color = true;
        }
    }
    config.cwd = Cwd.get();
    config.env = Env.name();
    config.build_id = build_id;
    return config;
}
