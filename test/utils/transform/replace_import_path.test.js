import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { to_dirname } from '../../../src/utils/to.js';
import { replace_import_path } from '../../../src/utils/transform.js';

describe('utils/transform/replace_import_path', () => {
    const __dirname = join(to_dirname(import.meta.url), '..', '..', '..');

    it('undefined', () => {
        strictEqual(replace_import_path(), '');
    });
    it('content without', () => {
        strictEqual(replace_import_path('empty'), 'empty');
    });
    it('content without', () => {
        strictEqual(
            replace_import_path(`import fs from 'fs';
        import { Logger } from '@lib/utils/logger.js';`),
            `import fs from 'fs';
        import { Logger } from '${__dirname}/src/utils/logger.js';`
        );
    });
});
