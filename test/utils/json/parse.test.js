import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { parse } from '../../../src/utils/json.js';
import { Logger } from '../../../src/utils/logger.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/json/parse', () => {
    let log = [];
    before(() => {
        Cwd.set(process.cwd());
        Sinon.stub(Logger, 'output');
        Logger.output.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        Cwd.set(undefined);
        Logger.output.restore();
    });
    it('undefined', () => {
        const value = parse();
        deepStrictEqual(value, undefined);
        deepStrictEqual(log, []);
    });
    it('empty string', () => {
        const value = parse('');
        deepStrictEqual(value, undefined);
        deepStrictEqual(log, []);
    });
    it('true', () => {
        const value = parse('true');
        deepStrictEqual(value, true);
        deepStrictEqual(log, []);
    });
    it('error', () => {
        const value = parse('tre');
        deepStrictEqual(value, undefined);
        // deepStrictEqual(log, [['', '', '✖', '@parse\n[SyntaxError] Unexpected token e in JSON at position 2']]);
        deepStrictEqual(log, [['', '', '✖', `@parse\n[SyntaxError] Unexpected token 'e', "tre" is not valid JSON`]]);

    });
});
