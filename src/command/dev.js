import { check_env } from '../action/check_env.js';
import { intial_build } from '../action/initial_build.js';
import { EnvType } from '../struc/env.js';
import { package_watcher } from '../utils/watcher.js';
import { Env } from '../vars/env.js';
import { UniqId } from '../vars/uniq_id.js';

export async function dev_command(config) {
    // dev command has forced dev state, when nothing is defined
    if (Env.get() == EnvType.prod) {
        Env.set(EnvType.dev);
    }

    await check_env();

    const build_id = UniqId.load();
    UniqId.set(build_id);

    const { packages } = await intial_build(build_id, config);
    console.log(packages);

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
