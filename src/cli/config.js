import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import { filled_string, is_string } from '../utils/validate.js';

export function extract_cli_config(argv) {
    const default_config = {
        cwd: process.cwd(),
        interpreter: undefined,
        script: undefined,
        command: [],
        flags: undefined
    };

    if (!Array.isArray(argv) || argv.length == 0) {
        return default_config;
    }
    default_config.interpreter = argv[0];
    default_config.script = argv[1];
    if (argv.length <= 2) {
        return default_config;
    }

    // extract commands & flags
    let flags = undefined;
    let last_flag;
    default_config.command = argv
        .slice(2)
        .filter((arg) => {
            // flag found
            if (arg.indexOf('-') == 0) {
                if (!flags) {
                    flags = {};
                }
                const argument = arg.replace(/^-+/, '').split('=');

                // fallback value
                if (argument.length == 1) {
                    argument[1] = true;
                }
                // convert numbers
                let value = argument[1];
                if (is_string(value)) {
                    value = parseFloat(argument[1]);
                    if (isNaN(value)) {
                        value = argument[1].replace(/^['"]/, '').replace(/['"]$/, '');
                    }
                }

                // handle bool values
                if (value === 'true' || value === 'TRUE') {
                    value = true;
                }
                if (value === 'false' || value === 'FALSE') {
                    value = false;
                }
                last_flag = argument[0];
                flags[argument[0]] = value;
                return false;
            }
            if (!last_flag || !filled_string(arg)) {
                return true;
            }
            // add the char to the last flag
            flags[last_flag] += ' ' + arg;
            return false;
        })
        .map((cmd) => cmd.toLowerCase());
    if (flags) {
        default_config.flags = flags;
        // inspect mode requires single mode otherwise the debug post will be used multiple times
        if (flags.inspect) {
            flags.single = true;
        }
    }
    return default_config;
}

export function get_wyvr_version() {
    const __dirname = dirname(fileURLToPath(import.meta.url));

    const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), { encoding: 'utf-8' }));

    if (pkg && pkg.version) {
        return pkg.version;
    }
    /* c8 ignore next */
    return undefined;
}
