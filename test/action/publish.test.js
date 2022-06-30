import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import Sinon from 'sinon';
import { publish } from '../../src/action/publish.js';
import { FOLDER_RELEASES } from '../../src/constants/folder.js';
import { remove } from '../../src/utils/file.js';
import { Logger } from '../../src/utils/logger.js';
import { to_plain } from '../../src/utils/to.js';
import { Cwd } from '../../src/vars/cwd.js';
import { ReleasePath } from '../../src/vars/release_path.js';
import { UniqId } from '../../src/vars/uniq_id.js';

describe('action/publish', async () => {
    let log = [];
    before(() => {
        Sinon.stub(Logger, 'output');
        Logger.output.callsFake((...args) => {
            log.push(...args.map(to_plain));
        });
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        Logger.output.restore();
        UniqId.set(undefined);
        remove(UniqId.file());
        Cwd.set(undefined);
        ReleasePath.set(undefined);
    });
    it('publish new release', async () => {
        const build_id = 'test';
        Cwd.set(join(process.cwd(), 'test', 'action', '_tests', 'publish'));
        ReleasePath.set(join(Cwd.get(), FOLDER_RELEASES, build_id));
        UniqId.set(build_id);
        publish();
    });
});
