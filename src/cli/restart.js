import { spawn } from 'child_process';
import { Logger } from '../utils/logger.js';

let debouncer;

export function restart() {
    Logger.warning('automatically restarting in 1s', process.pid);
    clearTimeout(debouncer);
    debouncer = setTimeout(() => {
        process.on('exit', function () {
            console.log(process.argv)
            spawn(process.argv.shift(), process.argv, {
                cwd: process.cwd(),
                detached: true,
                stdio: 'inherit',
            });
        });
        process.exit(0);
    }, 1000);
}
