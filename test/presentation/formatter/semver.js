import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { semver } from '../../../src/presentation/formatter.js';
import kleur from 'kleur';

describe('presenation/formatter/semver', () => {
    it('undefined', () => {
        strictEqual(semver(), '');
    });
    it('string', () => {
        strictEqual(semver('huhu'), kleur.bold('huhu'));
    });
    it('number, only major', () => {
        strictEqual(semver(1), kleur.bold('1'));
    });
    it('number, major + minor', () => {
        strictEqual(semver(1.3), `${kleur.bold('1')}.3`);
    });
    it('string, only major', () => {
        strictEqual(semver('1'), kleur.bold('1'));
    });
    it('string, major + minor', () => {
        strictEqual(semver('1.4'), `${kleur.bold('1')}.4`);
    });
    it('string, major + minor + patch', () => {
        strictEqual(semver('1.4.5'), `${kleur.bold('1')}.4${kleur.dim('.5')}`);
    });
    it('string, major + minor + patch + build', () => {
        strictEqual(semver('1.4.5.6'), `${kleur.bold('1')}.4${kleur.dim('.5.6')}`);
    });
    it('string, major + minor + patch + build + text', () => {
        strictEqual(semver('1.4.5.7-rc1'), `${kleur.bold('1')}.4${kleur.dim('.5.7-rc1')}`);
    });
    it('string, text + minor + patch + build + text', () => {
        strictEqual(semver('rc1.4.5.7-rc1'), `${kleur.bold('rc1')}.4${kleur.dim('.5.7-rc1')}`);
    });
    it('string, major + text + patch + build + text', () => {
        strictEqual(semver('1.text.5.7-rc1'), `${kleur.bold('1')}.text${kleur.dim('.5.7-rc1')}`);
    });
});
