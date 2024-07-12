import { strictEqual } from 'node:assert';
import { sleep_random } from '../../../src/utils/sleep.js';

describe('utils/sleep_random', () => {
    it('should resolve in the specified time span', async () => {
        const start = Date.now();
        await sleep_random(200, 400); // 1 second
        const end = Date.now();

        const duration = end - start;

        // We expect the duration to be around 1000ms, but due to the non-exact nature of setTimeout,
        // we allow some margin (50ms in this case)
        strictEqual(duration > 150 && duration < 550, true);
    });
});
