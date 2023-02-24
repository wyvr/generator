import Mocha from 'mocha';
import { append_cache_breaker } from './cache_breaker.mjs';
import { Logger } from './logger.js';
import { filled_array } from './validate.js';
const { EVENT_TEST_FAIL } = Mocha.Runner.constants; // other constants https://mochajs.org/api/runner.js.html

export async function run_tests(files) {
    if (!filled_array(files)) {
        return;
    }
    await new Promise((resolve) => {
        let stats = null;
        // generate the mocha instance with logging for errors
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
        // add the files to the suite
        files.forEach((file) => {
            mocha.addFile(file.test);
        });
        // execute tests and final event
        mocha
            .loadFilesAsync({
                // needed to avoid caching of resources
                esmDecorator: (path) => append_cache_breaker(path),
            })
            .then(() => {
                mocha.run(function (failures) {
                    if (!failures) {
                        const amount = stats?.tests || 0;
                        Logger.success(`${amount} test${amount == 1 ? '' : 's'}`, 'run successfully');
                    } else {
                        Logger.error('failed tests', failures);
                    }
                    resolve();
                });
            });
    });
}
