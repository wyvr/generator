import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { get_error_message } from '../../../src/utils/error.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/error/get_error_message', () => {
    const __dirname = to_dirname(import.meta.url);
    const cwd = Cwd.get();

    beforeEach(() => {
        Cwd.set(__dirname);
    });
    afterEach(() => {
        Cwd.set(cwd);
    });

    it('output', () => {
        const error = {
            name: 'SyntaxError',
            message: 'Cannot use import statement outside a module',
            stack: `test
                - ${__dirname}/gen/src/test/minus
                        at ${__dirname}/gen/src/test/at`,
        };
        deepStrictEqual(
            get_error_message(error),
            '[\x1B[1mSyntaxError\x1B[22m] Cannot use import statement outside a module\n' +
                '\x1B[2mstack\x1B[22m\n' +
                '\x1B[2m-\x1B[22m src/test/minus\n' +
                '\x1B[2m-\x1B[22m src/test/at'
        );
    });
    it('scoping', () => {
        const error = {
            name: 'SyntaxError',
            stack: `test
                - ${__dirname}/gen/src/test/minus
                        at ${__dirname}/gen/src/test/at`,
        };
        deepStrictEqual(
            get_error_message(error, 'file', 'test'),
            '\x1B[1m@test\x1B[22m\n' +
                '[\x1B[1mSyntaxError\x1B[22m] -\n' +
                '\x1B[2mstack\x1B[22m\n' +
                '\x1B[2m-\x1B[22m src/test/minus\n' +
                '\x1B[2m-\x1B[22m src/test/at\n' +
                '\x1B[2msource\x1B[22m file'
        );
    });
    it('minimal', () => {
        const error = {};
        deepStrictEqual(get_error_message(error, null, 'test'), `\x1B[1m@test\x1B[22m\n[] -`);
    });
});