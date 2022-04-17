import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { kill } from 'process';
import { Worker } from '../../src/model/worker.js';

describe('model/worker', () => {
    it('default values', () => {
        const worker = Worker();
        deepStrictEqual(Object.keys(worker), ['process', 'pid', 'status']);
        kill(worker.pid);
    });
    it('undefined', () => {
        const worker = Worker(() => undefined);
        deepStrictEqual(worker, undefined);
    });
});
