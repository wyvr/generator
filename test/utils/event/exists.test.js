import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { Event } from '../../../src/utils/event.js';

describe('utils/event/exists', () => {
    beforeEach(() => {
        Event.listeners = {};
        Event.auto_increment = 0;
    });
    it('empty', () => {
        deepStrictEqual(Event.exists('test', 'test'), false);
    });
    it('empty', () => {
        deepStrictEqual(Event.listeners, {});
        strictEqual(Event.on(), 0);
        deepStrictEqual(Event.exists('_', 'undefined'), true);
    });
    it('valid', () => {
        const cb = () => {};
        strictEqual(Event.on('test', 'test', cb), 0);
        deepStrictEqual(Event.exists('test', 'test'), true);
    });
});
