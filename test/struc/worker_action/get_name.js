import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WorkerAction, get_name } from '../../../src/struc/worker_action.js';

describe('struc/worker_action/get_name', () => {
    it('undefined', () => {
        strictEqual(get_name(undefined), undefined);
    });
    it('unknown value value', () => {
        strictEqual(get_name('nope'), undefined);
    });
    it('configure', () => {
        strictEqual(get_name(WorkerAction.configure), 'configure');
    });
});
