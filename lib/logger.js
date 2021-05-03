const cwd = process.cwd();
const pkg = require('_root/package.json');
const color = require('ansi-colors');
const env = process.env.WYVR_ENV || 'development';

module.exports = {
    log(...message) {
        console.log(...message);
    },
    present(key, ...values) {
        console.log(color.dim('>'), key, color.green(values.shift()), ...values.map((m) => this.stringify(m)));
    },
    info(key, ...values) {
        console.log(color.cyan('i'), key, color.cyan(values.shift()), ...values.map((m) => this.stringify(m)));
    },
    success(key, ...values) {
        console.log(color.green('✓'), key, color.green(values.shift()), ...values.map((m) => this.stringify(m)));
    },
    warning(...message) {
        const error = message.map((m) => color.yellow(this.stringify(m)));
        console.log(color.red('⚠'), ...error);
    },
    error(...message) {
        const error = message.map((m) => color.red(this.stringify(m)));
        console.log(color.red('✘'), ...error);
    },
    debug(...message) {
        if(env != 'debug') {
            return;
        }
        const error = message.map((m) => color.dim(this.stringify(m)));
        console.log(color.dim('~'), ...error);
    },
    logo() {
        const logo = [
            `__  __  __  __  __  ____`,
            `\\ \\/ /\\/ /\\/ /\\/ /\\/ /_/`,
            ` \\/_/\\/_/\\/ /\\/_/\\/_/`,
            `         /_/ generator ${color.dim('v')}${pkg.version}`,
        ].join('\n');
        console.log(color.cyan(logo));
        console.log('');
    },
    color,
    stringify(data) {
        if (typeof data == 'string' || typeof data == 'number') {
            return data;
        }
        return JSON.stringify(data, null, 2);
    },
};
