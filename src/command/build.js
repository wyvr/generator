import { check_env } from '../action/check_env.js';
import { clear_releases } from '../action/clear_releases.js';
import { critical } from '../action/critical.js';
import { intial_build } from '../action/initial_build.js';
import { optimize } from '../action/optimize.js';
import { publish } from '../action/publish.js';
import { UniqId } from '../vars/uniq_id.js';

export async function build_command(config) {
    await check_env();

    const build_id = UniqId.get();
    UniqId.set(build_id);
    UniqId.persist();

    const { media_query_files } = await intial_build(build_id, config);

    // Generate critical css
    const critical_result = await critical();

    // Optimize Pages
    // await optimize(media_query_files, critical_result);

    // Publish the new release
    await publish();

    await clear_releases(build_id);

    return build_id;
}
