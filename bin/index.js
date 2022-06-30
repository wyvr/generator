#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable no-undef */
import process from 'process';
import { extract_cli_config, get_wyvr_version } from '../src/cli/config.js';
import { command } from '../src/command.js';
import { Cwd } from '../src/vars/cwd.js';

Cwd.set(process.cwd());
const cli = extract_cli_config(process.argv);

const version = get_wyvr_version();

const config = {
    cli,
    version,
};

// console.error(config);
const result = await command(config);
console.log(result);

process.exit(0);
/* eslint-enable */
