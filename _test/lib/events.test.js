require('module-alias/register');

describe('Lib/Events', () => {
    const assert = require('assert');
    const { Events } = require('@lib/events');

    before(() => {});
    describe('on', () => {
        it('undefined', () => {
            const ev = new Events();
            assert.deepStrictEqual(ev.listeners, {})
            assert.strictEqual(ev.on(), 0);
            assert.strictEqual(!!ev.listeners, true);
            assert.strictEqual(!!ev.listeners._, true);
            assert.strictEqual(!!ev.listeners._.undefined, true);
            assert.deepStrictEqual(ev.listeners, {
                _: {
                    undefined: [
                        {
                            fn: undefined,
                            id: 0,
                        },
                    ],
                },
            });
        });
        it('valid', () => {
            const ev = new Events();
            const cb = () => {};
            assert.strictEqual(ev.on('test', 'test', cb), 0);
            assert.deepStrictEqual(ev.listeners, {
                test: {
                    test: [
                        {
                            fn: cb,
                            id: 0,
                        },
                    ],
                },
            });
        });
    });
    describe('off', () => {
        it('undefined', () => {
            const ev = new Events();
            ev.off();
            assert.deepStrictEqual(ev.listeners, {});
            const id = ev.on();
            assert.deepStrictEqual(ev.listeners, {
                _: {
                    undefined: [
                        {
                            fn: undefined,
                            id,
                        },
                    ],
                },
            });
            ev.off(undefined, undefined, id);
            assert.deepStrictEqual(ev.listeners, {
                _: {
                    undefined: [],
                },
            });
        });
    });
    describe('emit', () => {
        it('no listener', () => {
            let triggered = false;
            const ev = new Events();
            ev.emit('_', '_', true);
            assert.strictEqual(triggered, false);
        });
        it('triggered', () => {
            let triggered = false;
            const ev = new Events();
            ev.on('_', '_', (data) => {
                triggered = data;
            });
            ev.emit('_', '_', true);
            assert.strictEqual(triggered, true);
        });
        it('invalid listener', () => {
            let triggered = false;
            const ev = new Events();
            const id = ev.on('_', '_');
            ev.emit('_', '_', true);
            assert.strictEqual(triggered, false);
        });
    });
    describe('once', () => {
        it('empty listener', () => {
            const ev = new Events();
            ev.once();
            assert.deepStrictEqual(ev.listeners, {});
        });
        it('triggered listener', () => {
            let triggered = 0;
            const ev = new Events();
            const cb = (data) => {
                triggered = data;
            };
            ev.once('_', '_', cb);
            assert.strictEqual(!!ev.listeners, true);
            assert.strictEqual(!!ev.listeners._, true);
            assert.strictEqual(!!ev.listeners._._, true);
            assert.strictEqual(ev.listeners._._.length, 1);
            ev.emit('_', '_', 1);
            ev.emit('_', '_', 2);
            assert.deepStrictEqual(ev.listeners, {
                _: {
                    _: [],
                },
            });
            assert.deepStrictEqual(triggered, 1);
        });
    });
    describe('to_string', () => {
        const ev = new Events();
        it('undefined', () => {
            assert.strictEqual(ev.to_string(), 'undefined');
        });
        it('null', () => {
            assert.strictEqual(ev.to_string(null), 'null');
        });
        it('string', () => {
            assert.strictEqual(ev.to_string('test'), 'test');
        });
        it('number', () => {
            assert.strictEqual(ev.to_string(5), '5');
        });
    });
});
