import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import net from 'net';
import Sinon from 'sinon';
import { port_in_use } from '../../../src/utils/port.js';

describe('utils/port/port_in_use', () => {
    function new_server() {
        return { events: {}, port: undefined, host: undefined, content: [] };
    }
    let sandbox;
    let server = new_server();
    before(() => {
        sandbox = Sinon.createSandbox();
        sandbox.stub(net, 'createServer');
        net.createServer.callsFake((callback) => {
            callback({
                write: (content) => {
                    server.content.push(content);
                },
                pipe: () => {},
            });
            return {
                on: (name, cb) => {
                    if (!Array.isArray(server.events[name])) {
                        server.events[name] = [];
                    }
                    server.events[name].push(cb);
                },
                listen: (port, host) => {
                    server.port = port;
                    server.host = host;
                },
                close: () => {},
            };
        });
    });
    afterEach(() => {
        server = new_server();
    });
    after(() => {
        sandbox.restore();
    });

    it('undefined', async () => {
        strictEqual(await port_in_use(), true);
    });
    it('port in use', (done) => {
        let result;
        port_in_use(1000).then((data) => {
            result = data;
        });
        // simulate error
        server.events.error.map((cb) => cb());

        setTimeout(() => {
            deepStrictEqual(server.content, ['Echo server\r\n']);
            strictEqual(result, true);
            done();
        }, 100);
    });
    it('unused port', (done) => {
        let result;
        port_in_use(1000).then((data) => {
            result = data;
        });
        // simulate listening
        server.events.listening.map((cb) => cb());

        setTimeout(() => {
            deepStrictEqual(server.content, ['Echo server\r\n']);
            strictEqual(result, false);
            done();
        }, 100);
    });
});
