import { check_env } from '../action/check_env.js';
import { get_config_data } from '../action/get_config_data.js';
import { intial_build, pre_initial_build } from '../action/initial_build.js';
import { present } from '../action/present.js';
import { FOLDER_GEN, FOLDER_RELEASES } from '../constants/folder.js';
import { EnvType } from '../struc/env.js';
import { exists } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { watch_server } from '../utils/server.js';
import { package_watcher } from '../utils/watcher.js';
import { find_port } from '../utils/port.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { UniqId } from '../vars/uniq_id.js';
import { Config } from '../utils/config.js';

export async function dev_command(config) {
    // dev command has forced dev state, when nothing is defined
    if (Env.get() == EnvType.prod) {
        Env.set(EnvType.dev);
    }

    await check_env();
    const { port, wsport } = await get_ports(config);
    Config.set('port', port);
    Config.set('wsport', wsport);

    const build_id = UniqId.load();
    UniqId.set(build_id || UniqId.get());
    // check if fast build is available

    let packages;
    const is_fast = is_fast_build(config, build_id);
    if (!is_fast && config?.cli?.flags?.fast) {
        Logger.warning('fast build is not available');
    }
    if (is_fast) {
        const config_data = get_config_data(config, build_id);
        present(config_data);
        const { available_packages } = await pre_initial_build(build_id, config_data);

        packages = available_packages;
    } else {
        const result = await intial_build(build_id, config);
        packages = result.packages;
    }

    watch_server('localhost', port, wsport);

    await package_watcher(packages);

    /*
    private init() {
        Logger.block('watch');
        this.packages = Config.get('packages');
        if (!this.packages || !Array.isArray(this.packages) || this.packages.length == 0) {
            throw 'no packages to watch';
        }

        // create simple static server
        const pub = new static_server.Server(join(Cwd.get(), 'pub'), {
            cache: false,
            serverInfo: `wyvr`,
        });
        this.host = 'localhost';
        server('localhost', this.ports[0], this.IDLE_TEXT, null, async (req, res, uid) => {
            pub.serve(req, res, async (err) => {
                if (err) {
                    await fallback(req, res, uid, err);
                }
            });
        });

        this.connect();

        // watch for file changes
        file_watcher(this.packages, (changed_files: IWatchFile[]) => {
            const force_complete_rebuild = !!changed_files.find((file) => {
                return file.rel_path.indexOf('plugin') > -1;
            });
            this.rebuild(force_complete_rebuild, changed_files);
        });

        Logger.info('watching', this.packages.length, 'packages');
    }
    */

    return build_id;
}
export function is_fast_build(config, build_id) {
    return config?.cli?.flags?.fast && exists(Cwd.get(FOLDER_RELEASES, build_id)) && exists(Cwd.get(FOLDER_GEN));
}
export async function get_ports(config) {
    const port = await find_port(config?.cli?.flags?.port || 3000);
    const wsport = await find_port(config?.cli?.flags?.wsport || 3001);
    if (config?.cli?.flags?.port && config.cli.flags.port != port) {
        Logger.warning('can not use the given port', config.cli.flags.port, 'using', port, 'instead');
    }
    if (config?.cli?.flags?.wsport && config.cli.flags.wsport != wsport) {
        Logger.warning('can not use the given wsport', config.cli.flags.wsport, 'using', wsport, 'instead');
    }
    return { port, wsport };
}
