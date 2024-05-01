import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { WorkerStatus, get_name } from '../../../src/struc/worker_status.js';

describe('struc/worker_status/get_name', () => {
    it('undefined', () => {
        strictEqual(get_name(undefined), undefined);
    });
    it('unknown value value', () => {
        strictEqual(get_name('nope'), undefined);
    });
    it('dead', () => {
        strictEqual(get_name(WorkerStatus.dead), 'dead');
    });
});
