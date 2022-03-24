#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable no-undef */
import process from 'process';
import { extract_cli_config, get_wyvr_version } from '../src/cli/config.js';
import { get_logo } from '../src/presentation/logo.js';
import { command } from '../src/command.js';
import { Logger } from '../src/utils/logger.js';

const version = get_wyvr_version();

console.error(get_logo(version));

const cli = extract_cli_config(process.argv);

const config = {
    cli,
    version,
};

console.error(config);

Logger.log('test', 'key');
Logger.info('test', 'key');
Logger.present('test', 'key');
Logger.success('test', 'key');
Logger.warning('test', 'key');
Logger.error('test', 'key');
Logger.improve('test', 'key');
Logger.report('test', 'key');
Logger.block('test', 'key');
Logger.debug('test', 'key');

const result = await command(config);

console.error(result);
/* eslint-enable */
