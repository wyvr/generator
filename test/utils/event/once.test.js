import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Event } from '../../../src/utils/event.js';

describe('utils/event/once', () => {
    beforeEach(() => {
        Event.listeners = {};
        Event.auto_increment = 0;
    });
    it('empty listener', () => {
        Event.once();
        deepStrictEqual(Event.listeners, {});
    });
    it('triggered listener', () => {
        let triggered = 0;
        const cb = (data) => {
            triggered = data;
        };
        Event.once('_', '_', cb);
        strictEqual(Event.listeners._._.length, 1);
        Event.emit('_', '_', 1);
        Event.emit('_', '_', 2);
        deepStrictEqual(Event.listeners, {
            _: {
                _: [],
            },
        });
        deepStrictEqual(triggered, 1);
    });
});
