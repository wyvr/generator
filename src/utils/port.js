import net from 'net';
import { is_int } from './validate.js';

/**
 * Return the next available port starting from the given port
 * @param {number} port 
 * @returns 
 */
export async function find_port(port) {
    if (!is_int(port)) {
        return undefined;
    }
    while (port <= 65535) {
        const in_use = await port_in_use(port);
        if (!in_use) {
            return port;
        }
        // test next port
        port++;
    }
    return undefined;
}

/**
 * Check if the given port is used, not available
 * @param {number} port 
 * @returns 
 */
export async function port_in_use(port) {
    if (!is_int(port)) {
        return true;
    }
    return new Promise((resolve) => {
        const server = net.createServer((socket) => {
            socket.write('Echo server\r\n');
            socket.pipe(socket);
        });

        server.on('error', () => {
            resolve(true);
        });
        server.on('listening', () => {
            server.close();
            resolve(false);
        });

        server.listen(port, '127.0.0.1');
    });
}
