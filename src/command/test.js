import { check_env } from '../action/check_env.js';
import { get_config_data } from '../action/get_config_data.js';
import { get_present_command } from '../action/present.js';
import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { collect_files } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { run_tests } from '../utils/tests.js';
import { Cwd } from '../vars/cwd.js';
import { UniqId } from '../vars/uniq_id.js';

export async function test_command(config) {
    await check_env();

    const build_id = UniqId.load();
    if (!build_id) {
        Logger.error('no id available in', UniqId.file());
        return;
    }
    UniqId.set(build_id);

    const config_data = get_config_data(config, build_id);

    const { command, flags } = get_present_command(config_data?.cli?.command, config_data?.cli?.flags);
    process.title = `wyvr ${command}`;
    Logger.present('command', command, Logger.color.dim(flags));

    const test_files = collect_files(Cwd.get(FOLDER_GEN_SRC)).filter((file) => file.match(/\.spec\.[mc]?js$/));
    Logger.present('found', test_files.length, 'test files');
    const test_results = await run_tests(test_files);
    return test_results?.failures;
}
