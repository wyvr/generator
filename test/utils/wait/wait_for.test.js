import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { wait_for } from '../../../src/utils/wait.js';

describe('utils/wait/wait_for', () => {
    it('should resolve to true when check_fn returns true before max time', async function () {
        let value = false;
        setTimeout(() => (value = true), 50);
        const result = await wait_for(() => value, 10, 100);
        strictEqual(result, true);
    });
    it('should resolve to false when check_fn never returns true before max time', async function () {
        const result = await wait_for(() => false, 10, 100);
        strictEqual(result, false);
    });
    it('should return false immediately if check_fn is not a function', async function () {
        const result = await wait_for(12345, 10, 100);
        strictEqual(result, false);
    });
});
