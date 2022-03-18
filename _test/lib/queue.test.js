require('module-alias/register');

describe('Lib/Queue', () => {
    const assert = require('assert');
    const { Queue, QueueEntry } = require('@lib/queue');

    before(() => {});

    describe('new Queue', () => {
        it('empty', () => {
            const q = new Queue();
            assert.strictEqual(q._length, 0);
            assert.strictEqual(q.first, null);
            assert.strictEqual(q.last, null);
            assert.deepStrictEqual(Object.keys(q), ['first', 'last', '_length']);
        });
    });
    describe('length', () => {
        it('empty', () => {
            const q = new Queue();
            assert.strictEqual(q.length, 0);
        });
        it('avoid setting length', () => {
            const q = new Queue();
            q.length = 1;
            assert.strictEqual(q.length, 0);
        });
        it('setting length over private prop', () => {
            const q = new Queue();
            q._length = 1;
            assert.strictEqual(q.length, 1);
        });
    });
    describe('push', () => {
        it('add first item', () => {
            const q = new Queue();

            assert.strictEqual(q.length, 0);
            q.push(true);
            assert.strictEqual(q.length, 1);
            assert.strictEqual(q.first.data, true);
            assert.strictEqual(q.first.next, null);
            assert.strictEqual(q.last.data, true);
            assert.strictEqual(q.last.next, null);
            assert.strictEqual(q.first, q.last);
        });
        it('add second item', () => {
            const q = new Queue();

            assert.strictEqual(q.length, 0);
            q.push(true);
            q.push(false);
            assert.strictEqual(q.length, 2);
            assert.strictEqual(q.first.data, true);
            assert.strictEqual(q.first.next, q.last);
            assert.strictEqual(q.last.data, false);
            assert.strictEqual(q.last.next, null);
            assert.strictEqual(q.first.next, q.last);
        });
        it('add third item', () => {
            const q = new Queue();

            assert.strictEqual(q.length, 0);
            q.push(true);
            q.push(false);
            q.push(null);
            assert.strictEqual(q.length, 3);
            assert.strictEqual(q.first.data, true);
            assert.strictEqual(q.first.next.data, false);
            assert.strictEqual(q.last.data, null);
            assert.strictEqual(q.last.next, null);
        });
    });
    describe('take', () => {
        it('empty', () => {
            const q = new Queue();
            assert.strictEqual(q.take(), null);
        });
        it('take all out', () => {
            const q = new Queue();
            q.push(1);
            q.push(2);
            q.push(3);
            assert.strictEqual(q.take(), 1);
            assert.strictEqual(q.take(), 2);
            assert.strictEqual(q.take(), 3);
        });
    });
    describe('view', () => {
        it('empty', () => {
            const q = new Queue();
            assert.strictEqual(q.view(), null);
        });
        it('view mutiple times', () => {
            const q = new Queue();
            q.push(1);
            assert.strictEqual(q.view(), 1);
            assert.strictEqual(q.view(), 1);
        });
        it('view mutiple times with mutiple entries', () => {
            const q = new Queue();
            q.push(1);
            q.push(2);
            q.push(3);
            assert.strictEqual(q.view(), 1);
            assert.strictEqual(q.view(), 1);
        });
    });
    describe('new QueueEntry', () => {
        it('empty', () => {
            const q = new QueueEntry();
            assert.strictEqual(q.data, undefined);
            assert.strictEqual(q.next, null);
        });
        it('data', () => {
            const q = new QueueEntry(true);
            assert.strictEqual(q.data, true);
            assert.strictEqual(q.next, null);
        });
    });
});
