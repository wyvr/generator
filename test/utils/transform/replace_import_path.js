import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { replace_import_path } from '../../../src/utils/transform.js';

describe('utils/transform/replace_import_path', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url), '..', '..', '..')));

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
