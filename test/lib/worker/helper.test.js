require('module-alias/register');

describe('Lib/Worker/WorkerHelper', () => {
    const assert = require('assert');
    const { WorkerHelper } = require('@lib/worker/helper');
    const { WorkerStatus } = require('@lib/struc/worker/status');
    const { WorkerAction } = require('@lib/struc/worker/action');
    const { LogType } = require('@lib/struc/log');
    let send = null;
    let messages = [];
    before(() => {
        send = process.send;
        process.send = (data) => {
            messages.push(data.data);
        };
        process.env.WYVR_ENV = 'debug';
    });
    afterEach(() => {
        messages = [];
    });
    describe('send', () => {
        it('undefined', () => {
            WorkerHelper.send();
            assert.deepStrictEqual(messages, [undefined]);
        });
        it('null', () => {
            WorkerHelper.send(null);
            assert.deepStrictEqual(messages, [null]);
        });
        it('string', () => {
            WorkerHelper.send('test');
            assert.deepStrictEqual(messages, ['test']);
        });
        it('number', () => {
            WorkerHelper.send(10);
            assert.deepStrictEqual(messages, [10]);
        });
        it('array', () => {
            WorkerHelper.send([0, 1, 2]);
            assert.deepStrictEqual(messages, [[0, 1, 2]]);
        });
        it('object', () => {
            WorkerHelper.send({ key: 'value' });
            assert.deepStrictEqual(messages, [{ key: 'value' }]);
        });
        it('array of objects', () => {
            WorkerHelper.send([{ key: 'value' }, { key: 'value' }]);
            assert.deepStrictEqual(messages, [[{ key: 'value' }, { key: 'value' }]]);
        });
    });
    describe('send_status', () => {
        it('undefined', () => {
            process.env.WYVR_ENV = 'dev';
            WorkerHelper.send_status();
            assert.deepStrictEqual(messages, [{ action: { key: 2, value: WorkerStatus.undefined } }]);
            process.env.WYVR_ENV = 'debug';
        });
        it('null', () => {
            process.env.WYVR_ENV = 'dev';
            WorkerHelper.send_status(null);
            assert.deepStrictEqual(messages, [{ action: { key: 2, value: WorkerStatus.exists } }]);
            process.env.WYVR_ENV = 'debug';
        });
        it('unknown', () => {
            process.env.WYVR_ENV = 'dev';
            WorkerHelper.send_status(243);
            assert.deepStrictEqual(messages, [{ action: { key: 2, value: WorkerStatus.exists } }]);
            process.env.WYVR_ENV = 'debug';
        });
        it('idle[4]', () => {
            process.env.WYVR_ENV = 'dev';
            WorkerHelper.send_status(243);
            assert.deepStrictEqual(messages, [{ action: { key: 2, value: WorkerStatus.exists } }]);
            process.env.WYVR_ENV = 'debug';
        });
    });
    describe('send_action', () => {
        it('undefined', () => {
            WorkerHelper.send_action();
            assert.deepStrictEqual(messages, [{ action: { key: undefined, key_name: undefined, value: undefined } }]);
        });
        it('status null', () => {
            WorkerHelper.send_action(WorkerAction.status, null);
            assert.deepStrictEqual(messages, [{ action: { key: 2, key_name: 'status', value: null, value_name: undefined } }]);
        });
        it('status idle', () => {
            WorkerHelper.send_action(WorkerAction.status, WorkerStatus.idle);
            assert.deepStrictEqual(messages, [{ action: { key: 2, key_name: 'status', value: 4, value_name: 'idle' } }]);
        });
        it('emit', () => {
            WorkerHelper.send_action(WorkerAction.emit, null);
            assert.deepStrictEqual(messages, [{ action: { key: 8, key_name: 'emit', value: null } }]);
        });
        it('env dev', () => {
            process.env.WYVR_ENV = 'dev';
            WorkerHelper.send_action(WorkerAction.status, WorkerStatus.idle);
            assert.deepStrictEqual(messages, [{ action: { key: 2, value: 4 } }]);
            process.env.WYVR_ENV = 'debug';
        });
    });
    describe('get_status', () => {
        it('undefined', () => {
            assert.strictEqual(WorkerHelper.get_status(), WorkerStatus.undefined);
        });
        it('null', () => {
            assert.strictEqual(WorkerHelper.get_status(null), WorkerStatus.exists);
        });
        it('unknown', () => {
            assert.strictEqual(WorkerHelper.get_status(244), WorkerStatus.exists);
        });
        it('undefined[0]', () => {
            assert.strictEqual(WorkerHelper.get_status(0), WorkerStatus.undefined);
            assert.strictEqual(WorkerHelper.get_status('undefined'), WorkerStatus.undefined);
        });
        it('exists[1]', () => {
            assert.strictEqual(WorkerHelper.get_status(1), WorkerStatus.exists);
            assert.strictEqual(WorkerHelper.get_status('exists'), WorkerStatus.exists);
        });
        it('done[2]', () => {
            assert.strictEqual(WorkerHelper.get_status(2), WorkerStatus.done);
            assert.strictEqual(WorkerHelper.get_status('done'), WorkerStatus.done);
        });
        it('idle[4]', () => {
            assert.strictEqual(WorkerHelper.get_status(4), WorkerStatus.idle);
            assert.strictEqual(WorkerHelper.get_status('idle'), WorkerStatus.idle);
        });
        it('busy[8]', () => {
            assert.strictEqual(WorkerHelper.get_status(8), WorkerStatus.busy);
            assert.strictEqual(WorkerHelper.get_status('busy'), WorkerStatus.busy);
        });
        it('dead[16]', () => {
            assert.strictEqual(WorkerHelper.get_status(16), WorkerStatus.dead);
            assert.strictEqual(WorkerHelper.get_status('dead'), WorkerStatus.dead);
        });
    });
    after(() => {
        process.send = send;
    });
});
