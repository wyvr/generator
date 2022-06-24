// import { app_command } from './command/app';
import { build_command } from './command/build.js';
// import { clear_command } from './command/clear';
// import { create_command } from './command/create';
// import { cron_command } from './command/cron';
// import { health_command } from './command/health';
// import { regenerate_command } from './command/regenerate';
// import { report_command } from './command/report';
import { unknown_command } from './command/unknown.js';
import { nano_to_milli } from './utils/convert.js';
import { Logger } from './utils/logger.js';
import { filled_array } from './utils/validate.js';

export function get_command(config) {
    const commands = config?.cli?.command;
    if (!filled_array(commands)) {
        return undefined;
    }
    return commands[0];
}

export async function command(config) {
    const start = process.hrtime.bigint();
    let result = '';
    switch (get_command(config)) {
        // case 'app':
        //     return await app_command(config);
        case 'build':
            result = await build_command(config);
            break;
        // case 'clear':
        //     return await clear_command(config);
        // case 'create':
        //     return await create_command(config);
        // case 'cron':
        //     return await cron_command(config);
        // case 'health':
        //     return await health_command(config);
        // case 'regenerate':
        //     return await regenerate_command(config);
        // case 'report':
        //     return await report_command(config);
        default:
            result = await unknown_command(config);
            break;
    }
    const duration_text = `${Math.round(nano_to_milli(process.hrtime.bigint() - start))} ${Logger.color.dim('ms')}`;
    Logger.success('total execution time', duration_text);
    return result;
}
