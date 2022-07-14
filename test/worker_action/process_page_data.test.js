import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { process_page_data } from '../../src/worker_action/process_page_data.js';
import { Cwd } from '../../src/vars/cwd.js';
import { join } from 'path';
import { to_plain } from '../../src/utils/to.js';
import Sinon from 'sinon';
import { Logger } from '../../src/utils/logger.js';
import { FOLDER_GEN_SERVER } from '../../src/constants/folder.js';

describe('worker_action/process_page_data', () => {
    let log = [];
    let send_data;
    let mock_send;
    const path = join(process.cwd(), 'test', 'worker_action', '_tests', 'process_page_data');
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

    it('undefined', () => {
        deepStrictEqual(process_page_data(), undefined);
    });
    it('sample page', () => {
        const mtime = new Date().toISOString();
        deepStrictEqual(
            process_page_data({
                url: '/url',
                content: 'text',
            }, mtime),
            {
                _wyvr: {
                    change_frequence: 'monthly',
                    extension: 'html',
                    identifier: 'default',
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
        deepStrictEqual(send_data.data.action.value.identifier, 'default');
    });
});
