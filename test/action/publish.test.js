import { deepStrictEqual } from 'assert';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { remove } from 'fs-extra';
import { describe, it } from 'mocha';
import { join } from 'path';
import Sinon from 'sinon';
import { publish } from '../../src/action/publish.js';
import { FOLDER_RELEASES } from '../../src/constants/folder.js';
import { Logger } from '../../src/utils/logger.js';
import { to_dirname } from '../../src/utils/to.js';
import { Cwd } from '../../src/vars/cwd.js';
import { ReleasePath } from '../../src/vars/release_path.js';
import { UniqId } from '../../src/vars/uniq_id.js';

describe('action/publish', async () => {
    after(() => {
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
