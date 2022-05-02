import { Config } from '../utils/config.js';
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
    config.cwd = Cwd.get();
    config.env = Env.name();
    config.build_id = build_id;
    return config;
}
