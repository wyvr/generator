// import { app_command } from './command/app';
import { get_config_data } from './action/get_config_data.js';
import { app_command } from './command/app.js';
import { build_command } from './command/build.js';
import { dev_command } from './command/dev.js';
// import { clear_command } from './command/clear';
// import { create_command } from './command/create';
// import { cron_command } from './command/cron';
// import { health_command } from './command/health';
// import { regenerate_command } from './command/regenerate';
// import { report_command } from './command/report';
import { unknown_command } from './command/unknown.js';
import { version_command } from './command/version.js';
import { get_logo } from './presentation/logo.js';
import { nano_to_milli } from './utils/convert.js';
import { Logger } from './utils/logger.js';
import { to_plain } from './utils/to.js';
import { filled_array } from './utils/validate.js';
import { Cwd } from './vars/cwd.js';
import { WorkerController } from './worker/controller.js';

export function get_command(config) {
    const commands = config?.cli?.command;
    if (!filled_array(commands)) {
        return undefined;
    }
    return commands[0];
}

export async function command(config) {
    const start = process.hrtime.bigint();
    Cwd.set(config?.cli?.cwd);
    let result = '';
    config = get_config_data(config);
    if (!config?.cli?.flags?.silent) {
        const logo = get_logo(config?.version);
        /* eslint-disable no-console */
        console.error(config?.cli?.flags?.plain ? to_plain(logo) : logo);
        console.error('');
        /* eslint-enable */
    }

    switch (get_command(config)) {
        case 'app':
            result = await app_command(config);
            break;
        case 'dev':
            result = await dev_command(config);
            break;
        case 'build':
            result = await build_command(config);
            break;
        case 'version':
            result = await version_command(config);
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
    WorkerController.exit();
    const duration = nano_to_milli(process.hrtime.bigint() - start);
    const duration_text = `${Math.round(duration)} ${Logger.color.dim('ms')}`;
    Logger.success('total execution time', duration_text);
    return { result, duration };
}
