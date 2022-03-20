#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable no-undef */
import { readFileSync } from 'fs';
import process from 'process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { extract_cli_config, inject_config_into_process } from '../lib/cli/config.js';
import { get_logo } from '../lib/presentation/logo.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), { encoding: 'utf-8' }));
console.log(get_logo(pkg.version));

const cli = extract_cli_config(process.argv);

const config = {
    cli,
    pkg
};
// add wyvr to the process
inject_config_into_process(process, { cli_config });

console.log(process.wyvr.cli_config);

/* eslint-enable */
