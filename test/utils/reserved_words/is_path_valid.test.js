import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { is_path_valid } from '../../../src/utils/reserved_words.js';
import Sinon from 'sinon';
import { to_plain } from '../../../src/utils/to.js';

describe('utils/reserved_words/is_path_valid', () => {
    let sandbox;
    let log = [];

    beforeEach(() => {
        sandbox = Sinon.createSandbox();
        sandbox.stub(console, 'log');
        console.log.callsFake((...args) => {
            log.push(args.map(to_plain));
        });
    });

    afterEach(() => {
        sandbox.restore();
        log = [];
    });

    it('should return true if the type if not a string', () => {
        strictEqual(is_path_valid(false), true);
        deepStrictEqual(log, []);
    });
    it('should return true if path is empty', () => {
        strictEqual(is_path_valid(''), true);
        deepStrictEqual(log, []);
    });

    it('should return true for valid path', () => {
        const path = '/valid/path';
        strictEqual(is_path_valid(path), true);
        deepStrictEqual(log, []);
    });

    it('should call Logger.error when path contains reserved words', () => {
        const path = '/media/reserved';

        strictEqual(is_path_valid(path), false);
        deepStrictEqual(log, [
            ['✖', 'path /media/reserved contains reserved words'],
        ]);
    });
});
