import { generate_server } from './generate_server.js';
import { Logger } from './../logger.js';
import { websocket_server } from './websocket_server.js';
import { ServerShowRequests } from '../../vars/server_show_requests.js';

export function dev_server(port, wsport, packages, fallback) {
    Logger.emit = true;
    ServerShowRequests.set(false);
    generate_server(
        port,
        true,
        () => {
            Logger.info('onEnd');
        },
        fallback
    );
    websocket_server(wsport, packages);
}
