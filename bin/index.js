#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable no-undef */
import process from 'process';
import { extract_cli_config, get_wyvr_version } from '../src/cli/config.js';
import { get_logo } from '../src/presentation/logo.js';
import { command } from '../src/command.js';
import { Cwd } from '../src/vars/cwd.js';
import { to_plain } from '../src/utils/to.js';

Cwd.set(process.cwd());
const cli = extract_cli_config(process.argv);

const version = get_wyvr_version();

const logo = get_logo(version);
console.error(cli?.flags?.plain ? to_plain(logo) : logo);
console.error('');

const config = {
    cli,
    version,
};

// console.error(config);
const result = await command(config);
console.log(result);

process.exit(0);
/* eslint-enable */
