import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Event } from '../../../src/utils/event.js';

describe('utils/event/on', () => {
    beforeEach(()=> {
        Event.listeners = {};
        Event.auto_increment = 0;
    });
    it('undefined', () => {
        
        deepStrictEqual(Event.listeners, {});
        strictEqual(Event.on(), 0);
        deepStrictEqual(Event.listeners, {
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
        const cb = () => {};
        strictEqual(Event.on('test', 'test', cb), 0);
        deepStrictEqual(Event.listeners, {
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
