#!/usr/bin/env node

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { get_logo } from '../lib/presentation/logo.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), { encoding: 'utf-8' }));
console.log(get_logo(pkg.version));
