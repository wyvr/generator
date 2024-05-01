import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import Sinon from 'sinon';
import { build_cache } from '../../../src/utils/routes.js';
import { collect_files, remove } from '../../../src/utils/file.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/routes/build_cache', () => {
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
        collect_files(dir, 'json').forEach((file) => {
            if (file.match(/routes_cache\.json$/)) {
                remove(file);
            }
        });
    });
    it('empty gen/routes folder', async () => {
        Cwd.set(join(dir, 'empty'));
        deepStrictEqual(await build_cache(), []);
        deepStrictEqual(log, []);
    });
    it('build cache', async () => {
        Cwd.set(join(dir, 'simple'));
        deepStrictEqual(await build_cache(), [join(dir, 'simple/gen/routes/a.js')]);
        deepStrictEqual(log, []);
    });
});
