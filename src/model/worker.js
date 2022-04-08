import { fork } from 'child_process';
import { join } from 'path';
import { WyvrPath } from '../vars/wyvr_path.js';

export function Worker(custom_fork) {
    const module_path = join(WyvrPath.get(), 'worker.js');
    const instance = custom_fork ? custom_fork(module_path) : fork(module_path);

    if(!instance) {
        return undefined;
    }
    return {
        process: instance,
        pid: instance.pid,
        status: undefined,
    };
}
