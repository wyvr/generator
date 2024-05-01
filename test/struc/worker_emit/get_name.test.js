import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { WorkerEmit, get_name } from '../../../src/struc/worker_emit.js';

describe('struc/worker_emit/get_name', () => {
    it('undefined', () => {
        strictEqual(get_name(undefined), undefined);
    });
    it('unknown value value', () => {
        strictEqual(get_name('nope'), undefined);
    });
    it('dead', () => {
        strictEqual(get_name(WorkerEmit.inject_shortcode_identifier), 'inject_shortcode_identifier');
    });
});
