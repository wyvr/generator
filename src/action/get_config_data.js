import { EnvType } from '../struc/env.js';
import { LogType } from '../struc/log.js';
import { Config } from '../utils/config.js';
import { Logger } from '../utils/logger.js';
import { is_number, is_object } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';

export function get_config_data(cli_config, build_id) {
    const config = Config.get();
    if (cli_config) {
        for (const key of Object.keys(cli_config)) {
            config[key] = cli_config[key];
        }
    }

    if (is_object(cli_config?.cli?.flags)) {
        if (cli_config.cli.flags.dev) {
            Env.set(EnvType.dev);
        }
        if (cli_config.cli.flags.debug) {
            Env.set(EnvType.debug);
            Logger.log_level = LogType.debug;
        }
        if (cli_config.cli.flags.plain) {
            Logger.remove_color = true;
            Logger.spinner.remove_color = true;
        }
        if (cli_config.cli.flags.silent) {
            Logger.disable = true;
        }
        if (cli_config.cli.flags.log_file) {
            Logger.log_file = cli_config.cli.flags.log_file;
        }
        if (cli_config.cli.flags.log_level) {
            Logger.log_level = LogType[cli_config.cli.flags.log_level] || LogType.log;
        }
        if (is_number(cli_config.cli.flags.worker)) {
            const worker_ratio = Math.max(0, Math.min(1, cli_config.cli.flags.worker));
            if (!config.worker) {
                config.worker = {};
            }
            config.worker.ratio = worker_ratio;
        }
    }
    config.cwd = Cwd.get();
    config.env = Env.name();
    config.build_id = build_id;
    return config;
}
