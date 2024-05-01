import { deepStrictEqual, match } from 'node:assert';
import { describe, it } from 'mocha';
import { get_logo } from '../../../src/presentation/logo.js';
import kleur from 'kleur';

describe('presenation/logo/get_logo', () => {
    it('undefined', () => {
        match(get_logo(), /unknown version/);
    });
    it('string', () => {
        match(get_logo('huhu'), /huhu/);
    });
    it('version', () => {
        deepStrictEqual(get_logo('1.2.3').indexOf(`${kleur.bold(1)}.2${kleur.dim('.3')}`) > -1, true);
    });
});
