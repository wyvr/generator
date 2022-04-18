import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Event } from '../../../src/utils/event.js';

describe('utils/event/off', () => {
    beforeEach(() => {
        Event.listeners = {};
        Event.auto_increment = 0;
    });
    it('undefined', () => {
        Event.off();
        deepStrictEqual(Event.listeners, {});
    });
    it('off', () => {
        const id = Event.on();
        deepStrictEqual(Event.listeners, {
            _: {
                undefined: [
                    {
                        fn: undefined,
                        id,
                    },
                ],
            },
        });
        Event.off(undefined, undefined, id);
        deepStrictEqual(Event.listeners, {
            _: {
                undefined: [],
            },
        });
    });
});
