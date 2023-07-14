import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { process_page_data } from '../../src/action_worker/process_page_data.js';
import { Cwd } from '../../src/vars/cwd.js';
import { join } from 'path';
import { to_plain } from '../../src/utils/to.js';
import Sinon from 'sinon';
import { Logger } from '../../src/utils/logger.js';
import { FOLDER_GEN_SERVER } from '../../src/constants/folder.js';

describe('action_worker/process_page_data', () => {
    let log = [];
    const path = join(process.cwd(), 'test', 'action_worker', '_tests', 'process_page_data');
    before(() => {
        Cwd.set(path);
        Sinon.stub(Logger, 'output');
        Logger.output.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
    });
    beforeEach(() => {});
    afterEach(() => {
        log = [];
    });
    after(() => {
        Cwd.set(undefined);
        Logger.output.restore();
    });

    it('undefined', async () => {
        deepStrictEqual(await process_page_data(), undefined);
    });
    it('sample page', async () => {
        const mtime = new Date().toISOString();
        deepStrictEqual(
            await process_page_data(
                {
                    url: '/url',
                    content: 'text',
                },
                mtime
            ),
            {
                _wyvr: {
                    change_frequence: 'monthly',
                    extension: 'html',
                    identifier: 'default',
                    identifier_data: {
                        doc: 'Default.js',
                        identifier: 'default',
                        layout: 'Default.js',
                        page: 'Default.js',
                    },
                    language: 'en',
                    mtime,
                    collection: [
                        {
                            order: 0,
                            scope: 'all',
                            url: '/url',
                            visible: true,
                        },
                    ],
                    persist: false,
                    is_exec: false,
                    priority: 0.5,
                    private: false,
                    static: false,
                    template: {
                        doc: ['Default.svelte'],
                        layout: ['Default.svelte'],
                        page: ['Default.svelte'],
                    },
                    template_files: {
                        doc: join(path, FOLDER_GEN_SERVER, 'doc', 'Default.js'),
                        layout: join(path, FOLDER_GEN_SERVER, 'layout', 'Default.js'),
                        page: join(path, FOLDER_GEN_SERVER, 'page', 'Default.js'),
                    },
                },
                url: '/url',
                content: 'text',
            }
        );
    });
});
