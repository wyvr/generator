import { createServer } from 'net';

export class Port {
    static async find(from_port: number): Promise<number> {
        let in_use = true;
        let port = 0;
        if(!from_port || isNaN(from_port)) {
            return null;
        }
        while(in_use) {
            in_use = await this.in_use(from_port);
            if(!in_use) {
                port = from_port;
            }
            from_port++;
        }
        return port;
    }
    static async in_use(port: number): Promise<boolean> {
        if (isNaN(port)) {
            return false;
        }
        return new Promise((resolve) => {
            const server = createServer((socket) => {
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
}
