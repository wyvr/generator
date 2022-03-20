export const extract_cli_config = (argv: string[]) => {
    const default_config = {
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
    default_config.command = argv.slice(2).filter((arg) => {
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
    });
    if (flags) {
        default_config.flags = flags;
    }
    return default_config;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const inject_config_into_process = (process: NodeJS.Process, config: any): void => {
    if (typeof process != 'object' || !process.pid || !config) {
        return;
    }
    (<any>process).wyvr = config;
};
/* eslint-enable @typescript-eslint/no-explicit-any */
