import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { compile_svelte_from_code } from '../../../src/utils/compile_svelte.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { join } from 'path';
import { to_plain } from '../../../src/utils/to.js';
import Sinon from 'sinon';
import { Logger } from '../../../src/utils/logger.js';
import { read } from '../../../src/utils/file.js';

describe('utils/compile_svelte/compile_svelte_from_code', () => {
    let log = [];
    let send_data;
    let mock_send;
    const path = join(process.cwd(), 'test', 'utils', 'compile_svelte', '_tests');
    before(() => {
        Cwd.set(path);
        Sinon.stub(Logger, 'output');
        Logger.output.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
        mock_send = process.send;
        process.send = (data) => {
            send_data = data;
        };
    });
    beforeEach(() => {});
    afterEach(() => {
        log = [];
    });
    after(() => {
        Cwd.set(undefined);
        Logger.output.restore();
        process.send = mock_send;
    });

    it('exclude css into the js', async () => {
        const file = join(path, 'Styled.svelte');
        const content = read(file);
        const result = await compile_svelte_from_code(content, file, 'client', false);
        deepStrictEqual(Object.keys(result), ['js', 'css', 'ast', 'warnings', 'vars', 'stats']);
        deepStrictEqual(result.js.code.includes('append_styles('), false);
        deepStrictEqual(result.css.code != '', true);
        deepStrictEqual(log, []);
    });
    it('include the css into the js', async () => {
        const file = join(path, 'Styled.svelte');
        const content = read(file);
        const result = await compile_svelte_from_code(content, file, 'client', true);
        deepStrictEqual(Object.keys(result), ['js', 'css', 'ast', 'warnings', 'vars', 'stats']);
        deepStrictEqual(result.js.code.includes('append_styles('), true);
        deepStrictEqual(result.css.code != '', true);
        deepStrictEqual(log, []);
    });
});
