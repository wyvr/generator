import { emitKeypressEvents } from 'readline';
import { Logger } from '../utils/logger.js';
import { restart } from './restart.js';

export function quick_actions() {
    Logger.info('quick actions', '(R)estart');
    const stdin = process.openStdin();
    emitKeypressEvents(process.stdin);
    stdin.setRawMode(true);
    //process.stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('keypress', function (chunk, key) {
        if (!key) {
            return;
        }
        if (key.name == 'r') {
            restart();
        }
        if (key.ctrl && key.name == 'c') {
            process.exit(0);
            return;
        }
    });
}
