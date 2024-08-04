#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable no-undef */
import process from 'node:process';
import { isPrimary } from 'node:cluster';
import { extract_cli_config, get_wyvr_version } from '../src/cli/config.js';
import { command } from '../src/command.js';
import { Cwd } from '../src/vars/cwd.js';
import { Storage } from '../src/utils/storage.js';
import { FOLDER_STORAGE } from '../src/constants/folder.js';
import { Logger } from '../src/utils/logger.js';
import { bind_error_events, get_error_message } from '../src/utils/error.js';
import { ClusterWorker } from '../src/cluster_worker.js';

Cwd.set(process.cwd());
Storage.set_location(FOLDER_STORAGE);

bind_error_events();
if (isPrimary) {
    const cli = extract_cli_config(process.argv);

    const version = get_wyvr_version();

    const config = {
        cli,
        version,
    };

    (async () => {
        try {
            const { result } = await command(config);
            if (result) {
                console.log(result);
            }
        } catch (e) {
            Logger.error(get_error_message(e, undefined, 'Fatal error'));
            process.exitCode = 1;
            process.exit(1);
            return;
        }
        process.exitCode = 0;
        process.exit(0);
        return;
    })();
    /* eslint-enable */
} else {
    // Cluster Worker, not from child_process
    // @NOTE: child_process forked processes could not share the same ports
    ClusterWorker();
}
