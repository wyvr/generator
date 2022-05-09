import { strictEqual, deepStrictEqual } from 'assert';
import cluster from 'cluster';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { LogType } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { IsWorker } from '../../../src/vars/is_worker.js';

describe('utils/logger/output', () => {
    let log, err;
    let result = [];
    let send_data;
    let mock_send;
    before(() => {
        // runs once before the first test in this block
        log = console.log;
        console.log = (...args) => {
            result.push(args);
        };
        err = console.error;
        console.error = (...args) => {
            result.push(args);
        };

        mock_send = process.send;
        process.send = (data) => {
            send_data = data;
        };
    });
    afterEach(() => {
        result = [];
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
        console.error = err;
        process.send = mock_send;
        IsWorker.set(undefined);
        Logger.pre = '';
    });
    it('undefined', () => {
        Logger.output();
        deepStrictEqual(result, [[undefined, '']]);
    });

    it('null', () => {
        Logger.output(null);
        deepStrictEqual(result, [[undefined, '']]);
    });
    it('symbol', () => {
        Logger.output(undefined, undefined, '#');
        deepStrictEqual(result, [['#', '']]);
    });
    it('symbol + text', () => {
        Logger.output(undefined, undefined, '#', 'a');
        deepStrictEqual(result, [['#', 'a']]);
    });
    it('symbol + multiple text', () => {
        Logger.output(undefined, undefined, '#', 'a', 'b');
        deepStrictEqual(result, [['#', 'a b']]);
    });
    it('no symbol + text', () => {
        Logger.output(undefined, undefined, 'a');
        deepStrictEqual(result, [['a', '']]);
    });
    it('no symbol + multiple text', () => {
        Logger.output(undefined, undefined, 'a', 'b');
        deepStrictEqual(result, [['a', 'b']]);
    });
    it('send to primary from worker', () => {
        IsWorker.set(true);

        Logger.output(LogType.log, undefined, undefined, 'b');

        deepStrictEqual(send_data, {
            data: {
                action: {
                    key: 0,
                    value: {
                        messages: ['b'],
                        type: LogType.log,
                    },
                },
            },
            pid: process.pid,
        });
        deepStrictEqual(result, []);
    });
    it('send to primary from worker with pre', () => {
        IsWorker.set(true);

        Logger.pre = '>';
        Logger.output(LogType.log, undefined, undefined, 'b');

        deepStrictEqual(send_data, {
            data: {
                action: {
                    key: 0,
                    value: {
                        messages: ['>', 'b'],
                        type: LogType.log,
                    },
                },
            },
            pid: process.pid,
        });
        deepStrictEqual(result, []);
    });
});
