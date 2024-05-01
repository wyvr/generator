import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import Sinon from 'sinon';
import { to_plain } from '../../../src/utils/to.js';
import { watcher_event } from '../../../src/utils/watcher.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/watcher/watcher_event', () => {
    let log = [];
    before(() => {
        Cwd.set(join(process.cwd(), 'test', 'utils', 'watcher', '_tests'));
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
    });
    after(() => {
        Cwd.set(undefined);
        console.error.restore();
    });
    afterEach(() => {
        log = [];
    });
    it('undefined', () => {
        watcher_event();
        deepStrictEqual(log, []);
    });
});
