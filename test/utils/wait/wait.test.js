import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { wait } from '../../../src/utils/wait.js';

describe('utils/wait/wait', () => {
    it('should resolve after specified duration', async () => {
        const start = Date.now();
        await wait(500);
        const end = Date.now();

        // We are using a range here since setTimeout is not precise
        const timeframe = end - start;
        strictEqual(timeframe > 490 && timeframe < 510, true);
    });
    it('should resolve immediately for non-positive durations', async () => {
        const start = Date.now();
        await wait(0);
        const end = Date.now();

        // Here again, we allow some grace due to non-preciseness of setTimeout
        const timeframe = end - start;
        strictEqual(timeframe < 10, true);
    });
});
