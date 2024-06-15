import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import net from 'net';
import Sinon from 'sinon';
import { find_port } from '../../../src/utils/port.js';

describe('utils/port/find_port', () => {
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
                listen: ({port}) => {
                    server.port = port;
                    server.host = 'localhost';
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
        strictEqual(await find_port(), undefined);
    });
    it('port available', (done) => {
        let result;
        find_port(1000).then((data) => {
            result = data;
        });

        // simulate listening
        server.events.listening.map((cb) => cb());

        setTimeout(() => {
            strictEqual(result, 1000);
            done();
        }, 10);
    });
    it('third port available', (done) => {
        let result;
        find_port(1000).then((data) => {
            result = data;
        });

        // simulate error
        server.events.error.map((cb) => cb());

        setTimeout(() => {
            // simulate error
            server.events.error.map((cb) => cb());

            setTimeout(() => {
                // simulate listening
                server.events.listening.map((cb) => cb());

                setTimeout(() => {
                    strictEqual(result, 1002);
                    done();
                }, 10);
            }, 10);
        }, 10);
    });
    it('port to high', async () => {
        const result = await find_port(65536);

        strictEqual(result, undefined);
    });
});
