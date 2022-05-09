import { strictEqual } from 'assert';
import cluster from 'cluster';
import { after, describe, it } from 'mocha';
import { IsWorker } from '../../src/vars/is_worker.js';

describe('vars/is_worker', () => {
    beforeEach(()=> {
        IsWorker.set(undefined);
    })
    after(()=> {
        IsWorker.set(undefined);
    })
    it('get', () => {
        strictEqual(IsWorker.get(), cluster.isWorker);
    });
    it('undefined', () => {
        IsWorker.set(undefined);
        strictEqual(IsWorker.get(), cluster.isWorker);
    });
    it('set value', () => {
        IsWorker.set(true);
        strictEqual(IsWorker.get(), true);
    });
    it('custom value', () => {
        IsWorker.set('huhu');
        strictEqual(IsWorker.get(), true);
    });
});
