import { strictEqual } from 'node:assert';
import { remove_server_events } from '../../../src/utils/transform.js';

describe('utils/transform/remove_server_events', () => {
    it('undefined', () => {
        strictEqual(remove_server_events(), '');
    });
    it('null', () => {
        strictEqual(remove_server_events(null), '');
    });
    it('empty', () => {
        strictEqual(remove_server_events(''), '');
    });
    it('lorem ipsum', () => {
        strictEqual(remove_server_events('lorem ipsum'), 'lorem ipsum');
    });
    describe('onServer', () => {
        it('empty onServer', () => {
            strictEqual(remove_server_events('onServer()'), '');
        });
        it('arrow onServer', () => {
            strictEqual(remove_server_events('onServer(() => {})'), '');
            strictEqual(
                remove_server_events('onServer((test) => { console.log(); })'),
                ''
            );
        });
        it('function onServer', () => {
            strictEqual(remove_server_events('onServer(function() {})'), '');
            strictEqual(
                remove_server_events(
                    'onServer(function(test) { console.log(); })'
                ),
                ''
            );
            strictEqual(
                remove_server_events('onServer(function test() {})'),
                ''
            );
            strictEqual(
                remove_server_events(
                    'onServer(function test(test) { console.log(); })'
                ),
                ''
            );
        });
        it('broken onServer', () => {
            strictEqual(remove_server_events('onServer('), 'onServer(');
        });
    });
    describe('onRequest', () => {
        it('empty onRequest', () => {
            strictEqual(remove_server_events('onRequest()'), '');
        });
        it('arrow onRequest', () => {
            strictEqual(remove_server_events('onRequest(() => {})'), '');
            strictEqual(
                remove_server_events('onRequest((test) => { console.log(); })'),
                ''
            );
        });
        it('function onRequest', () => {
            strictEqual(remove_server_events('onRequest(function() {})'), '');
            strictEqual(
                remove_server_events(
                    'onRequest(function(test) { console.log(); })'
                ),
                ''
            );
            strictEqual(
                remove_server_events('onRequest(function test() {})'),
                ''
            );
            strictEqual(
                remove_server_events(
                    'onRequest(function test(test) { console.log(); })'
                ),
                ''
            );
        });
        it('broken onRequest', () => {
            strictEqual(remove_server_events('onRequest('), 'onRequest(');
        });
    });
    describe('onServer & onRequest', () => {
        it('empty onServer & onRequest', () => {
            strictEqual(remove_server_events('onServer() onRequest()'), '');
        });
        it('arrow onServer & onRequest', () => {
            strictEqual(
                remove_server_events('const a = 1; onServer(() => {}) onRequest(() => {})'),
                'const a = 1;  '
            );
            strictEqual(
                remove_server_events(
                    'const a = 2; onServer((test) => { console.log(); }) onRequest((test) => { console.log(); })'
                ),
                'const a = 2;  '
            );
        });
        it('function onServer & onRequest', () => {
            strictEqual(
                remove_server_events(
                    'const a = 1; onServer(function() {}) onRequest(function() {})'
                ),
                'const a = 1;  '
            );
            strictEqual(
                remove_server_events(
                    'const a = 2; onServer(function(test) { console.log(); }) onRequest(function(test) { console.log(); })'
                ),
                'const a = 2;  '
            );
            strictEqual(
                remove_server_events(
                    'const a = 3; onServer(function test() {}) onRequest(function test() {})'
                ),
                'const a = 3;  '
            );
            strictEqual(
                remove_server_events(
                    'const a = 4; onServer(function test(test) { console.log(); }) onRequest(function test(test) { console.log(); })'
                ),
                'const a = 4;  '
            );
        });
        it('broken onServer & onRequest', () => {
            strictEqual(
                remove_server_events('onServer(onRequest('),
                'onServer(onRequest('
            );
        });
        it('broken onServer', () => {
            strictEqual(
                remove_server_events('onServer(onRequest()'),
                'onServer('
            );
        });
        it('broken onRequest', () => {
            strictEqual(
                remove_server_events('onRequest(onServer()'),
                'onRequest('
            );
        });
    });
});
