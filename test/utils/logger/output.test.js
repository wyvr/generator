import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { LogType } from '../../../src/struc/log.js';
import { Event } from '../../../src/utils/event.js';
import { Logger } from '../../../src/utils/logger.js';
import { IsWorker } from '../../../src/vars/is_worker.js';
import { fakeConsole } from './fakeConsole.js';

describe('utils/logger/output', () => {
    const C = fakeConsole();

    let mock_send;
    let send_data;

    beforeEach(() => {
        C.start();

        mock_send = process.send;
        process.send = (data) => {
            send_data = data;
        };
    });

    afterEach(() => {
        send_data = undefined;
        process.send = mock_send;
        IsWorker.set(undefined);
        Logger.remove_color = false;
    });

    it('undefined', () => {
        Logger.output();
        deepStrictEqual(C.end(), [['', '']]);
    });

    it('null', () => {
        Logger.output(null);
        deepStrictEqual(C.end(), [['', '']]);
    });
    it('symbol', () => {
        Logger.output(undefined, undefined, '#');
        deepStrictEqual(C.end(), [['#', '']]);
    });
    it('symbol + text', () => {
        Logger.output(undefined, undefined, '#', 'a');
        deepStrictEqual(C.end(), [['#', 'a']]);
    });
    it('symbol + multiple text', () => {
        Logger.output(undefined, undefined, '#', 'a', 'b');
        deepStrictEqual(C.end(), [['#', 'a b']]);
    });
    it('no symbol + text', () => {
        Logger.output(undefined, undefined, 'a');
        deepStrictEqual(C.end(), [['a', '']]);
    });
    it('no symbol + multiple text', () => {
        Logger.output(undefined, undefined, 'a', 'b');
        deepStrictEqual(C.end(), [['a', 'b']]);
    });
    it('remove color', () => {
        Logger.remove_color = true;
        Logger.output(undefined, Logger.color.yellow, Logger.color.red('#'), Logger.color.blue('a'));
        deepStrictEqual(C.end(), [['#', 'a']]);
    });
    it('remove color pre', () => {
        Logger.remove_color = true;
        Logger.pre = Logger.color.green('pre');
        Logger.output(undefined, Logger.color.yellow, Logger.color.red('#'), Logger.color.blue('a'));
        Logger.pre = '';
        deepStrictEqual(C.end(), [['#', 'a']]);
    });
    it('disable', () => {
        Logger.disable = true;
        Logger.pre = Logger.color.green('pre');
        Logger.output(undefined, Logger.color.yellow, Logger.color.red('#'), Logger.color.blue('a'));
        Logger.disable = false;
        Logger.pre = '';
        deepStrictEqual(C.end(), []);
    });
    it('emit & disable', (done) => {
        Logger.disable = true;
        Logger.emit = true;
        const emitted = [];
        Event.once('logger', 'undefined', (data) => {
            emitted.push(data);
            deepStrictEqual(emitted, [{ char: '#', message: ['a'] }]);
            done();
        });
        Logger.pre = Logger.color.green('pre');
        Logger.output(undefined, Logger.color.yellow, Logger.color.red('#'), Logger.color.blue('a'));
        Logger.emit = false;
        Logger.disable = false;
        Logger.pre = '';
        deepStrictEqual(C.end(), []);
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
                        type: LogType.log
                    }
                }
            },
            pid: process.pid
        });
        deepStrictEqual(C.end(), []);
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
                        type: LogType.log
                    }
                }
            },
            pid: process.pid
        });
        deepStrictEqual(C.end(), []);
    });
});
