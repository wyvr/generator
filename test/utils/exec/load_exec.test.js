import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import Sinon from 'sinon';
import { load_exec } from '../../../src/utils/exec.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/exec/load_exec', () => {
    const dir = join(process.cwd(), 'test', 'utils', 'exec', '_tests');
    let sandbox;
    let log = [];
    before(() => {
        sandbox = Sinon.createSandbox();
        sandbox.stub(console, 'error');
        console.error.callsFake((...args) => {
            log.push(args.map(to_plain));
        });
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        Cwd.set(undefined);
        sandbox.restore();
    });
    it('undefined', async () => {
        Cwd.set(join(dir, 'load'));
        deepStrictEqual(await load_exec(), undefined);
        deepStrictEqual(log, []);
    });
    it('error', async () => {
        Cwd.set(join(dir, 'load'));
        deepStrictEqual(await load_exec(join(dir, 'load/error.js')), undefined);
        deepStrictEqual(log, [['✖', '@exec\n[ReferenceError] value is not defined\nsource error.js']]);
    });
});
