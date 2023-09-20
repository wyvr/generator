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

    const config_data = get_config_data(config, build_id);

    await WorkerController.initialize(Config.get('worker.ratio', 1), config_data?.cli?.flags?.single)

    const { media_query_files } = await intial_build(build_id, config_data);

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
