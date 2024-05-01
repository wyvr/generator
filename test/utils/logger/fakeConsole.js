import { to_plain } from '../../../src/utils/to.js';

export function fakeConsole() {
    const logs = [];
    let c_log;
    let c_error;
    return {
        start: () => {
            logs.length = 0;

            c_log = console.log;
            c_error = console.error;

            console.log = (...args) => {
                logs.push(args.map((x) => to_plain(x)));
            };
            console.error = (...args) => {
                logs.push(args.map((x) => to_plain(x)));
            };
        },
        reset: () => {
            logs.length = 0;
        },
        end: () => {
            console.log = c_log;
            console.error = c_error;
            return logs;
        }
    };
}
