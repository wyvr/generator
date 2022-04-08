import { Logger } from '../utils/logger.js';
import { is_object } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { UniqId } from '../vars/uniq_id.js';

export function present(config, command) {
    // UniqId.set(uniq);
    
    const id = UniqId.get();
    // prepare process
    process.title = `wyvr ${command} ${process.pid}`;
    // present some variables
    Logger.present('pid', process.pid, Logger.color.dim(`${process.title}`));
    Logger.present('cwd', Cwd.get());
    Logger.present('id', `${id.substring(0, 5)}${Logger.color.dim(id.substring(5))}`);
    Logger.present('environment', Env.name());
    
    let flags = '';
    if (is_object(config.cli.flags)) {
        flags = Object.keys(config.cli.flags).join(' ');
    }
    Logger.present('command', command, Logger.color.dim(flags));
}
