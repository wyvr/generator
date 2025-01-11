import { generate_server } from './generate_server.js';
import { Logger } from './../logger.js';
import { ServerShowRequests } from '../../vars/server_show_requests.js';
import { init_bus } from './bus.js';

export function dev_server(port, packages, fallback) {
    Logger.emit = true;
    ServerShowRequests.set(false);
    init_bus(packages);
    generate_server(port, true, fallback, true);
}
