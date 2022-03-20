#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable no-undef */
import process from 'process';
import { extract_cli_config, get_wyvr_version } from '../lib/cli/config.js';
import { get_logo } from '../lib/presentation/logo.js';

const version = get_wyvr_version();

console.log(get_logo(version));

const cli = extract_cli_config(process.argv);

const config = {
    cli,
    version,
};

console.log(config);

/* eslint-enable */
