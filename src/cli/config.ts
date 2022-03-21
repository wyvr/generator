import { ICliConfig } from '@lib/interface/config';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const extract_cli_config = (argv: string[]) => {
    const default_config: ICliConfig = {
        cwd: process.cwd(),
        interpreter: undefined,
        script: undefined,
        command: [],
        flags: undefined,
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
    default_config.command = argv
        .slice(2)
        .filter((arg) => {
            // flag found
            if (arg.indexOf('-') == 0) {
                if (!flags) {
                    flags = {};
                }
                /* eslint-disable @typescript-eslint/no-explicit-any */
                const argument: any[] = arg.replace(/^-+/, '').split('=');
                /* eslint-enable @typescript-eslint/no-explicit-any */

                // fallback value
                if (argument.length == 1) {
                    argument[1] = true;
                }
                // convert numbers
                let value = argument[1];
                if (typeof value == 'string') {
                    value = parseFloat(argument[1]);
                    if (isNaN(value)) {
                        value = argument[1].replace(/^['"]/, '').replace(/['"]$/, '');
                    }
                }

                flags[argument[0]] = value;
                return false;
            }
            return true;
        })
        .map((cmd) => cmd.toLowerCase());
    if (flags) {
        default_config.flags = flags;
    }
    return default_config;
};

export const get_wyvr_version = () => {
    const __dirname = dirname(fileURLToPath(import.meta.url));

    const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), { encoding: 'utf-8' }));

    if (pkg && pkg.version) {
        return pkg.version;
    }
    return undefined;
};