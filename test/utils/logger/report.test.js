import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { Report } from '../../../src/vars/report.js';
import { fakeConsole } from './fakeConsole.js';
import { IsWorker } from '../../../src/vars/is_worker.js';

describe('utils/logger/report', () => {
    const C = fakeConsole();

    const icon = LogIcon.report;

    let mock_send;
    let send_data;

    beforeEach(() => {
        C.start();
        Report.set(true);

        mock_send = process.send;
        process.send = (data) => {
            send_data = data;
        };
    });

    afterEach(() => {
        send_data = undefined;
        Report.set(false);
        Logger.report_content = [];
        process.send = mock_send;
        IsWorker.set(undefined);
    });

    it('hide', () => {
        Report.set(false);
        Logger.report('#');
        deepStrictEqual(C.end(), []);
        deepStrictEqual(send_data, undefined);
    });
    it('undefined', () => {
        Logger.report();
        deepStrictEqual(C.end(), []);
        deepStrictEqual(send_data, undefined);
    });

    it('key + multiple text', () => {
        Logger.report(500, 'a', 'b');
        deepStrictEqual(C.end(), [[icon, 'a b 500 ms']]);
        deepStrictEqual(send_data, undefined);
        deepStrictEqual(Logger.report_content, [[500, 'a', 'b']]);
    });
    it('report from worker', () => {
        IsWorker.set(true);
        Logger.report(500, 'a', 'b');
        deepStrictEqual(C.end(), []);
        deepStrictEqual(send_data.data, {
            action: {
                key: 0,
                value: {
                    messages: ['>', 'a', 'b', '500', '\x1B[2mms\x1B[22m'],
                    type: 2
                }
            }
        });
        strictEqual(!Number.isNaN(send_data.pid), true, 'pid is not a number');
        deepStrictEqual(Logger.report_content, []);
    });
    it('from worker', () => {
        Logger.report(500, 'a', 'b');
        deepStrictEqual(C.end(), [[icon, 'a b 500 ms']]);
        deepStrictEqual(send_data, undefined);
    });
});
