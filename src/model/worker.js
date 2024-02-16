import { fork } from 'child_process';
import { join } from 'path';
import { WyvrPath } from '../vars/wyvr_path.js';
import { Logger } from '../utils/logger.js';

/**
 * Worker function to create a new child process.
 * @param {Function} [custom_fork=fork] The function to use for creating the child process. Defaults to NodeJS fork function of child_process.
 * @returns {(Object|null)} If successful, returns an object with properties: 'process' - the created child process; 'pid' - the PID of the created child process; 'status' - undefined status field. Returns null on failure.
 */
export function Worker(custom_fork = fork) {
    if (typeof custom_fork !== 'function') {
        Logger.error('custom_fork must be a function!');
        return undefined;
    }

    const module_path = join(WyvrPath.get(), 'worker.js');
    const instance = custom_fork(module_path);

    if (!instance) {
        Logger.error('failed to create a new worker instance');
        return undefined;
    }

    return {
        process: instance,
        pid: instance.pid,
        status: undefined
    };
}
