import { check_env } from '../action/check_env.js';
import { get_config_data } from '../action/get_config_data.js';
import { get_present_command } from '../action/present.js';
import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { collect_files } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { run_tests } from '../utils/tests.mjs';
import { Cwd } from '../vars/cwd.js';
import { UniqId } from '../vars/uniq_id.js';

export async function test_command(config) {
    await check_env();

    const build_id = UniqId.load();
    UniqId.set(build_id || UniqId.get());

    const config_data = get_config_data(config, build_id);

    const { command, flags } = get_present_command(config_data?.cli?.command, config_data?.cli?.flags);
    process.title = `wyvr ${command} ${process.pid}`;
    Logger.present('command', command, Logger.color.dim(flags));

    const test_files = collect_files(Cwd.get(FOLDER_GEN_SRC)).filter((file) => file.match(/\.spec\.[mc]?js$/));
    const { failures } = await run_tests(test_files);
    return failures;
}
