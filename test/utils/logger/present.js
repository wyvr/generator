import { strictEqual, deepStrictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { LogColor, LogFirstValueColor, LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/present', () => {
    let log, err;
    let result = [];

    const icon = LogIcon.present;
    const color = LogFirstValueColor.present;
    before(() => {
        // runs once before the first test in this block
        log = console.log;
        console.log = (...args) => {
            result.push(args);
        };
        err = console.error;
        console.error = (...args) => {
            result.push(args);
        };
    });
    afterEach(() => {
        result = [];
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
        console.error = err;
    });
    it('undefined', () => {
        Logger.present();
        deepStrictEqual(result, [[icon, '']]);
    });

    it('key + multiple text', () => {
        Logger.present('#', 'a', 'b');
        deepStrictEqual(result, [[icon, `# ${color('a')} b`]]);
    });  
   
});
