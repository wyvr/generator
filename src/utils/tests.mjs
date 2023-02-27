import Mocha from 'mocha';
import { extname } from 'path';
import { get_cache_breaker } from './cache_breaker.mjs';
import { exists } from './file.js';
import { Logger } from './logger.js';
import { filled_array, filled_string, in_array } from './validate.js';
const { EVENT_TEST_FAIL } = Mocha.Runner.constants; // other constants https://mochajs.org/api/runner.js.html

export async function run_tests(files) {
    if (!filled_array(files)) {
        return;
    }
    return await new Promise((resolve) => {
        let stats = null;
        const mocha = new Mocha({
            reporter: function (runner) {
                stats = runner.stats;
                let number = 1;
                runner.on(EVENT_TEST_FAIL, (test, err) => {
                    Logger.error(
                        [
                            `failed test #${number}`,
                            Logger.color.bold(test.fullTitle()),
                            Logger.color.dim(`file:${test.file}`),
                            err.message,
                        ].join('\n')
                    );
                    number++;
                });
            },
        });
        files.forEach((file) => {
            if (file?.test) {
                mocha.addFile(file.test);
                return;
            }
            if (filled_string(file)) {
                mocha.addFile(file);
            }
        });
        mocha
            .loadFilesAsync({
                // needed to avoid caching of resources
                esmDecorator: (path) => {
                    return path + get_cache_breaker();
                },
            })
            .then(() => {
                mocha.run(function (failures) {
                    const result = { ok: failures == 0, stats, failures, files };
                    if (!failures) {
                        const amount = stats?.tests || 0;
                        Logger.success(`${amount} test${amount == 1 ? '' : 's'}`, 'run successfully');
                    } else {
                        Logger.error('failed tests', failures);
                    }
                    resolve(result);
                });
            });
    });
}

export function get_test_file(file) {
    const ext = extname(file);
    if (!in_array(['.js', '.cjs', '.mjs'], ext)) {
        return undefined;
    }
    const test_file = file.replace(new RegExp(`${ext}$`), `.spec${ext}`).replace(/\.spec\.spec/, '.spec');
    if (!exists(test_file)) {
        return undefined;
    }
    return { file, test: test_file };
}
