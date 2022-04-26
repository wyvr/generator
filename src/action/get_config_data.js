import { Config } from '../utils/config.js';
import { is_object } from '../utils/validate.js';
import { Env } from '../vars/env.js';

export function get_config_data(cli_config, build_id) {
    const config = Config.get();
    if (is_object(cli_config)) {
        Object.keys(cli_config).forEach((key) => {
            config[key] = cli_config[key];
        });
    }
    config.env = Env.name();
    config.build_id = build_id;
    return config;
}

/*
const config = Config.get(null);
        config.env = EnvType[Env.get()];
        config.https = !!config.https;
        config.build = UniqId.get();

config
{
  cli: {
    cwd: '/home/patrick/wyvr/example',
    interpreter: '/home/patrick/.nvm/versions/node/v16.14.2/bin/node',
    script: '/home/patrick/wyvr/generator/bin/index.js',
    command: [ 'build' ],
    flags: undefined
  },
  version: '0.0.0'
}
*/
