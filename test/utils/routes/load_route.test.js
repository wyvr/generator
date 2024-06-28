import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import Sinon from 'sinon';
import { load_route } from '../../../src/utils/routes.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/routes/load_route', () => {
    const dir = join(process.cwd(), 'test', 'utils', 'routes', '_tests');
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
        deepStrictEqual(await load_route(), undefined);
        deepStrictEqual(log, []);
    });
    it('error', async () => {
        Cwd.set(join(dir, 'load'));
        deepStrictEqual(await load_route(join(dir, 'load/error.js')), undefined);
        deepStrictEqual(log, [['✖', '@route\n[ReferenceError] value is not defined\nsource error.js']]);
    });
    it('contains not replaced src', async () => {
        Cwd.set(join(dir, 'load'));
        deepStrictEqual(await load_route(join(dir, 'load/contains_src.js')), undefined);
        deepStrictEqual(log, [
            [
                '✖',
                '@route\n' +
                    "[Error] Cannot find package '$src' imported from " +
                    dir +
                    '/load/contains_src.js\n' +
                    'source contains_src.js',
            ],
        ]);
    });
});
