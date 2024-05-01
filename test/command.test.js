import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { get_command } from '../src/command.js';

describe('command/get_command', () => {
    it('undefined', async () => {
        strictEqual(get_command(), undefined);
    });
    it('wrong data', async () => {
        strictEqual(get_command({ command: 'build' }), undefined);
    });
    it('correct command', async () => {
        strictEqual(get_command({ cli: { command: ['build'] } }), 'build');
    });
    it('correct multiple commands', async () => {
        strictEqual(get_command({ cli: { command: ['build', 'the', 'site'] } }), 'build');
    });
});
