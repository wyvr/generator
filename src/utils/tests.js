import Mocha from 'mocha';
import { dev_cache_breaker } from './cache_breaker.js';
import { Logger } from './logger.js';
import { filled_array, filled_string, is_object } from './validate.js';
import { uniq_values } from './uniq.js';
const { EVENT_TEST_FAIL } = Mocha.Runner.constants; // other constants https://mochajs.org/api/runner.js.html

let stats;
export async function run_tests(files) {
    if (!filled_array(files)) {
        return;
    }
    stats = undefined;
    /* c8 ignore start */
    return await new Promise((resolve) => {
        const mocha = new Mocha({
            reporter: WyvrReporter
        });
        for (const file of uniq_values(files)) {
            if (filled_string(file)) {
                mocha.addFile(file);
            }
        }
        mocha
            .loadFilesAsync({
                // needed to avoid caching of resources
                esmDecorator: (path) => {
                    return dev_cache_breaker(is_object(path) && path.pathname ? path.pathname : path);
                }
            })
            .then(() => {
                mocha.run((failures) => {
                    const result = { ok: failures === 0, stats, failures, files };
                    if (!failures) {
                        const amount = stats?.tests || 0;
                        Logger.success(`${amount} test${amount === 1 ? '' : 's'}`, 'run successfully');
                    } else {
                        Logger.error('failed tests', failures);
                    }
                    resolve(result);
                });
            });
    });
    /* c8 ignore end */
}

class WyvrReporter {
    constructor(runner) {
        stats = runner.stats;
        let number = 1;
        runner.on(EVENT_TEST_FAIL, (test, err) => {
            Logger.error([`failed test #${number}`, Logger.color.bold(test.fullTitle()), Logger.color.dim(`file:${test.file}`), err.message, ''].join('\n'));
            number++;
        });
    }
}
