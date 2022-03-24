import { strictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/unstyle', () => {
    it('undefined', () => {
        strictEqual(Logger.unstyle(), '');
    });
    it('unformated string', () => {
        strictEqual(Logger.unstyle('hello world'), 'hello world');
    });
    it('formated string simple', () => {
        const string = `hello ${kleur.blue('world')}`;
        strictEqual(Logger.unstyle(string), 'hello world');
    });
    it('formated string', () => {
        const string = `hello ${kleur.blue('world')} ${kleur.dim('dim')} ${kleur.bold('bold')} ${kleur.red(`mixed ${kleur.underline('value')}`)}`;
        strictEqual(Logger.unstyle(string), 'hello world dim bold mixed value');
    });
});
