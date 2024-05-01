import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { kill } from 'process';
import { Queue, QueueEntry } from '../../src/model/queue.js';
import { Worker } from '../../src/model/worker.js';
describe('model/Queue', () => {
    before(() => {});

    describe('new Queue', () => {
        it('empty', () => {
            const q = new Queue();
            strictEqual(q._length, 0);
            strictEqual(q.first, undefined);
            strictEqual(q.last, undefined);
            deepStrictEqual(Object.keys(q), ['first', 'last', '_length']);
        });
    });
    describe('length', () => {
        it('empty', () => {
            const q = new Queue();
            strictEqual(q.length, 0);
        });
        it('avoid setting length', () => {
            const q = new Queue();
            try {
                q.length = 1;
            } catch (e) {}
            strictEqual(q.length, 0);
        });
        it('setting length over private prop', () => {
            const q = new Queue();
            q._length = 1;
            strictEqual(q.length, 1);
        });
    });
    describe('push', () => {
        it('add first item', () => {
            const q = new Queue();

            strictEqual(q.length, 0);
            q.push(true);
            strictEqual(q.length, 1);
            strictEqual(q.first.data, true);
            strictEqual(q.first.next, undefined);
            strictEqual(q.last.data, true);
            strictEqual(q.last.next, undefined);
            strictEqual(q.first, q.last);
        });
        it('add second item', () => {
            const q = new Queue();

            strictEqual(q.length, 0);
            q.push(true);
            q.push(false);
            strictEqual(q.length, 2);
            strictEqual(q.first.data, true);
            strictEqual(q.first.next, q.last);
            strictEqual(q.last.data, false);
            strictEqual(q.last.next, undefined);
            strictEqual(q.first.next, q.last);
        });
        it('add third item', () => {
            const q = new Queue();

            strictEqual(q.length, 0);
            q.push(true);
            q.push(false);
            q.push(undefined);
            strictEqual(q.length, 3);
            strictEqual(q.first.data, true);
            strictEqual(q.first.next.data, false);
            strictEqual(q.last.data, undefined);
            strictEqual(q.last.next, undefined);
        });
    });
    describe('take', () => {
        it('empty', () => {
            const q = new Queue();
            strictEqual(q.take(), undefined);
        });
        it('take all out', () => {
            const q = new Queue();
            q.push(1);
            q.push(2);
            q.push(3);
            strictEqual(q.take(), 1);
            strictEqual(q.take(), 2);
            strictEqual(q.take(), 3);
        });
    });
    describe('view', () => {
        it('empty', () => {
            const q = new Queue();
            strictEqual(q.view(), undefined);
        });
        it('view mutiple times', () => {
            const q = new Queue();
            q.push(1);
            strictEqual(q.view(), 1);
            strictEqual(q.view(), 1);
        });
        it('view mutiple times with mutiple entries', () => {
            const q = new Queue();
            q.push(1);
            q.push(2);
            q.push(3);
            strictEqual(q.view(), 1);
            strictEqual(q.view(), 1);
        });
    });
    describe('new QueueEntry', () => {
        it('empty', () => {
            const q = new QueueEntry();
            strictEqual(q.data, undefined);
            strictEqual(q.next, undefined);
        });
        it('data', () => {
            const q = new QueueEntry(true);
            strictEqual(q.data, true);
            strictEqual(q.next, undefined);
        });
    });
});
