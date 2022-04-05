#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable no-undef */
import process from 'process';
import { extract_cli_config, get_wyvr_version } from '../src/cli/config.js';
import { get_logo } from '../src/presentation/logo.js';
import { command } from '../src/command.js';
import { Logger } from '../src/utils/logger.js';
import { Cwd } from '../src/vars/cwd.js';

Cwd.set(process.cwd())
const version = get_wyvr_version();

console.error(get_logo(version));

const cli = extract_cli_config(process.argv);

const config = {
    cli,
    version,
};


console.error(config);

const result = await command(config);

console.error(result);
/* eslint-enable */
