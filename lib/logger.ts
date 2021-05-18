const pkg = require('@root/package.json');
import * as color from 'ansi-colors';
const env = process.env.WYVR_ENV || 'development';

export class Logger {
    static color = color;
    static log(...message) {
        console.log(...message);
    }
    static present(key, ...values) {
        console.log(color.dim('>'), key, color.green(values.shift()), ...values.map((m) => this.stringify(m)));
    }
    static info(key, ...values) {
        console.log(color.cyan('i'), key, color.cyan(values.shift()), ...values.map((m) => this.stringify(m)));
    }
    static success(key, ...values) {
        console.log(color.green('✓'), key, color.green(values.shift()), ...values.map((m) => this.stringify(m)));
    }
    static warning(...message) {
        const error = message.map((m) => color.yellow(this.stringify(m)));
        console.log(color.yellow('⚠'), ...error);
    }
    static error(...message) {
        const error = message.map((m) => color.red(this.stringify(m)));
        console.log(color.red('✘'), ...error);
    }
    static debug(...message) {
        if (env != 'debug') {
            return;
        }
        const error = message.map((m) => color.dim(this.stringify(m)));
        console.log(color.dim('~'), ...error);
    }
    static logo() {
        const logo = [
            `__  __  __  __  __  ____`,
            `\\ \\/ /\\/ /\\/ /\\/ /\\/ /_/`,
            ` \\/_/\\/_/\\/ /\\/_/\\/_/`,
            `         /_/ generator ${color.dim('v')}${pkg.version}`,
        ].join('\n');
        console.log(color.cyan(logo));
        console.log('');
    }

    static stringify(data: any): string {
        if (typeof data == 'string' || typeof data == 'number') {
            return data.toString();
        }
        return JSON.stringify(data, null, 2);
    }
}
