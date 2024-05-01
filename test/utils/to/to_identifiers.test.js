import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { Identifier } from '../../../src/model/identifier.js';
import { clone } from '../../../src/utils/json.js';
import { to_identifiers } from '../../../src/utils/to.js';

describe('utils/to/to_identifiers', () => {
    const identifier = Identifier();
    it('undefined', () => {
        deepStrictEqual(to_identifiers(), {});
    });
    it('valid', () => {
        const mod_idfr = clone(identifier);
        mod_idfr.identifier = 'test';
        deepStrictEqual(to_identifiers({ test: identifier, huhu: identifier }, { test: mod_idfr, hihi: identifier }), {
            test: mod_idfr,
            hihi: identifier,
            huhu: identifier,
        });
    });
    it('invalid', () => {
        deepStrictEqual(to_identifiers({ test: identifier, huhu: identifier }, undefined), {
            test: identifier,
            huhu: identifier,
        });
    });
});
