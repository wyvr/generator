import { createServer } from 'net';

export class Port {
    static current_port = 3000;
    static async find(): Promise<number> {
        let in_use = true;
        let port = 0;
        while(in_use) {
            in_use = await this.in_use(this.current_port);
            if(!in_use) {
                port = this.current_port;
            }
            this.current_port++;
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

            server.on('error', (e) => {
                resolve(true);
            });
            server.on('listening', (e) => {
                server.close();
                resolve(false);
            });

            server.listen(port, '127.0.0.1');
        });
    }
}
