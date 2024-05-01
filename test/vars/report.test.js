import { strictEqual } from 'node:assert';
import { after, describe, it } from 'mocha';
import { Report } from '../../src/vars/report.js';

describe('vars/report', () => {
    it('undefined', () => {
        Report.set(undefined);
        strictEqual(Report.get(), false);
    });
    it('true', () => {
        Report.set(true);
        strictEqual(Report.get(), true);
    });
    it('false', () => {
        Report.set(false);
        strictEqual(Report.get(), false);
    });
    after(() => {
        Report.set(false);
    });
});
