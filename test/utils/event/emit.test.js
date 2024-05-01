import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { Event } from '../../../src/utils/event.js';

describe('utils/event/emit', () => {
    beforeEach(() => {
        Event.listeners = {};
        Event.auto_increment = 0;
    });
    it('no listener', () => {
        let triggered = false;
        Event.emit('_', '_', true);
        strictEqual(triggered, false);
    });
    it('triggered', () => {
        let triggered = false;
        Event.on('_', '_', (data) => {
            triggered = data;
        });
        Event.emit('_', '_', true);
        strictEqual(triggered, true);
    });
    it('invalid listener', () => {
        let triggered = false;
        const id = Event.on('_', '_');
        Event.emit('_', '_', true);
        strictEqual(triggered, false);
    });
});
