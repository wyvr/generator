import { check_env } from '../action/check_env.js';
import { clear_releases } from '../action/clear_releases.js';
import { critical } from '../action/critical.js';
import { get_config_data } from '../action/get_config_data.js';
import { intial_build } from '../action/initial_build.js';
import { optimize } from '../action/optimize.js';
import { publish } from '../action/publish.js';
import { sitemap } from '../action/sitemap.js';
import { Config } from '../utils/config.js';
import { UniqId } from '../vars/uniq_id.js';
import { WorkerController } from '../worker/controller.js';

export async function build_command(config) {
    await check_env();

    const build_id = UniqId.get();
    UniqId.set(build_id);

    const { media_query_files } = await intial_build(build_id, config);

    // Generate critical css
    const critical_result = await critical();

    // Optimize Pages
    await optimize(media_query_files, critical_result);

    // Create sitemap
    await sitemap();

    // Publish the new release
    await publish();

    await clear_releases(build_id);

    return build_id;
}
