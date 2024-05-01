import { strictEqual } from 'node:assert';
import { sleep } from '../../../src/utils/sleep.js';

describe('utils/sleep', () => {
    it('should resolve after the specified time period', async () => {
        const start = Date.now();
        await sleep(1000); // 1 second
        const end = Date.now();

        const duration = end - start;

        // We expect the duration to be around 1000ms, but due to the non-exact nature of setTimeout,
        // we allow some margin (50ms in this case)
        strictEqual(duration > 950 && duration < 1050, true);
    });
});
