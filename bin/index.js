#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable no-undef */
import { readFileSync } from 'fs';
import process from 'process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { extract_cli_config } from '../lib/cli/config.js';
import { get_logo } from '../lib/presentation/logo.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), { encoding: 'utf-8' }));
console.log(get_logo(pkg.version));

const cli = extract_cli_config(process.argv);

const config = {
    cli,
    pkg
};

console.log(config);

/* eslint-enable */
