import { check_env } from '../action/check_env.js';
import { intial_build } from '../action/initial_build.js';
import { EnvType } from '../struc/env.js';
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

    await intial_build(build_id, config);

    return build_id;
}
