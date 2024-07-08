import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import Sinon from 'sinon';
import { write } from '../../../src/utils/file.js';
import { to_plain } from '../../../src/utils/to.js';
import { package_watcher, unwatch } from '../../../src/utils/watcher.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/watcher/package_watcher', () => {
    let log = [];
    before(() => {
        Cwd.set(join(process.cwd(), 'test', 'utils', 'watcher', '_tests'));
        Sinon.stub(console, 'log');
        console.log.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
    });
    after(() => {
        Cwd.set(undefined);
        console.log.restore();
    });
    afterEach(() => {
        log = [];
    });
    it('undefined', async () => {
        await package_watcher();
        deepStrictEqual(log, [['✖', 'missing packages in package_watcher']]);
    });
    it('empty package', (done) => {
        package_watcher([
            {
                path: 'empty',
            },
        ]);
        setTimeout(() => {
            unwatch();
            deepStrictEqual(log, [
                ['✔', 'watching 1 packages'],
                ['...', ''],
                ['⬢', 'waiting for changes'],
            ]);
            done();
        }, 500);
    });
});
