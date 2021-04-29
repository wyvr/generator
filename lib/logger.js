const cwd = process.cwd();
const pkg = require('_root/package.json');
const color = require('ansi-colors');

module.exports = {
    log(...message) {
        console.log(...message);
    },
    present(key, ...values) {
        console.log(color.dim(' > '), key, color.green(values.shift()), ...values);
    },
    info(key, ...values) {
        console.log(color.cyan('(i)'), key, color.cyan(values.shift()), ...values);
    },
    success(key, ...values) {
        console.log(color.green('(✓)'), key, color.green(values.shift()), ...values);
    },
    warning(...message) {
        const error = message.map((m) => color.yellow(m));
        console.log(color.red('[⚠]'), ...error);
    },
    error(...message) {
        const error = message.map((m) => color.red(m));
        console.log(color.red('[✘]'), ...error);
    },
    logo() {
        const logo = [
            `__  __  __  __  __  ____`,
            `\\ \\/ /\\/ /\\/ /\\/ /\\/ /_/`,
            ` \\/_/\\/_/\\/ /\\/_/\\/_/`,
            `         /_/ generator ${color.dim('v')}${pkg.version}`,
        ].join('\n');
        console.log(color.magenta(logo));
        console.log('');
    },
    color,
};
