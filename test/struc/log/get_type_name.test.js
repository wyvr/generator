import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { LogType, get_type_name } from '../../../src/struc/log.js';

describe('struc/log/get_type_name', () => {
    it('undefined', () => {
        strictEqual(get_type_name(undefined), undefined);
    });
    it('unknown value value', () => {
        strictEqual(get_type_name('nope'), undefined);
    });
    it('dead', () => {
        strictEqual(get_type_name(LogType.block), 'block');
    });
});
