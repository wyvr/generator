import { strictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { to_plain } from '../../../src/utils/to.js';

describe('utils/to/to_plain', () => {
    it('undefined', () => {
        strictEqual(to_plain(), '');
    });
    it('unformated string', () => {
        strictEqual(to_plain('hello world'), 'hello world');
    });
    it('formated string simple', () => {
        const string = `hello ${kleur.blue('world')}`;
        strictEqual(to_plain(string), 'hello world');
    });
    it('formated string', () => {
        const string = `hello ${kleur.blue('world')} ${kleur.dim('dim')} ${kleur.bold('bold')} ${kleur.red(`mixed ${kleur.underline('value')}`)}`;
        strictEqual(to_plain(string), 'hello world dim bold mixed value');
    });
});
