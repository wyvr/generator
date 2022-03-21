import { app_command } from '@lib/command/app';
import { build_command } from '@root/src/command/build';
import { clear_command } from '@lib/command/clear';
import { create_command } from '@lib/command/create';
import { cron_command } from '@lib/command/cron';
import { health_command } from '@root/src/command/health';
import { regenerate_command } from '@lib/command/regenerate';
import { report_command } from '@root/src/command/report';
import { unknown_command } from '@lib/command/unknown';
import { IConfig } from '@lib/interface/config';

export async function command(config: IConfig) {
    const main_command = config.cli.command[0];
    switch (main_command) {
        // case 'app':
        //     return await app_command(config);
        // case 'build':
        //     return await build_command(config);
        // case 'clear':
        //     return await clear_command(config);
        case 'create':
            return await create_command(config);
        // case 'cron':
        //     return await cron_command(config);
        // case 'health':
        //     return await health_command(config);
        // case 'regenerate':
        //     return await regenerate_command(config);
        // case 'report':
        //     return await report_command(config);
        default:
            return await unknown_command(config);
    }
}
