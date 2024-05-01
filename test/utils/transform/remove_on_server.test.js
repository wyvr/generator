import { strictEqual } from 'node:assert';
import { remove_on_server } from '../../../src/utils/transform.js';

describe('utils/transform/remove_on_server', () => {
    it('undefined', () => {
        strictEqual(remove_on_server(), '');
    });
    it('null', () => {
        strictEqual(remove_on_server(null), '');
    });
    it('empty', () => {
        strictEqual(remove_on_server(''), '');
    });
    it('lorem ipsum', () => {
        strictEqual(remove_on_server('lorem ipsum'), 'lorem ipsum');
    });
    it('empty onServer', () => {
        strictEqual(remove_on_server('onServer()'), '');
    });
    it('arrow onServer', () => {
        strictEqual(remove_on_server('onServer(() => {})'), '');
        strictEqual(remove_on_server('onServer((test) => { console.log(); })'), '');
    });
    it('function onServer', () => {
        strictEqual(remove_on_server('onServer(function() {})'), '');
        strictEqual(remove_on_server('onServer(function(test) { console.log(); })'), '');
        strictEqual(remove_on_server('onServer(function test() {})'), '');
        strictEqual(remove_on_server('onServer(function test(test) { console.log(); })'), '');
    });
    it('broken onServer', () => {
        strictEqual(remove_on_server('onServer('), 'onServer(');
    });
});
