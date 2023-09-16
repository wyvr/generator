#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable no-undef */
import process from 'process';
import { extract_cli_config, get_wyvr_version } from '../src/cli/config.js';
import { command } from '../src/command.js';
import { Cwd } from '../src/vars/cwd.js';
import { Storage } from '../src/utils/storage.js';
import { FOLDER_STORAGE } from '../src/constants/folder.js';
import { Logger } from '../src/utils/logger.js';

Cwd.set(process.cwd());
Storage.set_location(FOLDER_STORAGE);
const cli = extract_cli_config(process.argv);

const version = get_wyvr_version();

const config = {
    cli,
    version,
};

// console.error(config);
(async () => {
    try {
        const { result } = await command(config);
        if (result) {
            console.log(result);
        }
    } catch (e) {
        Logger.error('Fatal error', e);
    }
    process.exitCode = 0;
    process.exit(0);
    return;
})();
/* eslint-enable */
