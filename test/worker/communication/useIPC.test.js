import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { useIPC } from '../../../src/worker/communication.js';

describe('worker/communication/useIPC', () => {
    afterEach(() => {
        useIPC(true);
    });
    it('from true, to true', () => {
        strictEqual(useIPC(true), true);
    });
    it('from true, to false', () => {
        strictEqual(useIPC(false), false);
    });
    it('from false, to false', () => {
        useIPC(false);
        strictEqual(useIPC(false), false);
    });
    it('from false, to true', () => {
        useIPC(false);
        strictEqual(useIPC(true), true);
    });
});
