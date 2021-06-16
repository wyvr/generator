const pkg = require('@root/package.json');
import * as color from 'ansi-colors';
import ora from 'ora';
const env = process.env.WYVR_ENV || 'development';

export class Logger {
    static color = color;
    static spinner = null;
    static last_text = null;

    static output(symbol, ...values) {
        if (this.spinner) {
            const text = values.map(this.stringify).join(' ');
            this.spinner.stopAndPersist({ text, symbol }).start(this.last_text).spinner = 'dots';
            return;
        }
        console.log(symbol, ...values);
    }
    static log(...values) {
        this.output('', ...values);
    }
    static present(key, ...values) {
        this.output(color.dim('>'), key, color.green(values.shift()), ...values);
    }
    static info(key, ...values) {
        this.output(color.cyan('i'), key, color.cyan(values.shift()), ...values);
    }
    static success(key, ...values) {
        this.output(color.green('✓'), key, color.green(values.shift()), ...values);
    }
    static warning(...values) {
        this.output(color.yellow('⚠'), ...values.map((v) => color.yellow(v)));
    }
    static error(...values) {
        this.output(color.red('✘'), ...values.map((v) => color.red(v)));
    }
    static debug(...values) {
        if (env != 'debug') {
            return;
        }
        this.output(color.dim('~'), ...values.map((v) => color.dim(v)));
    }
    static start(name: string) {
        if (env != 'production') {
            this.last_text = name || '';
            this.spinner = ora(name).start();
        }
    }
    static stop(name: string, duration_in_ms: number = null) {
        let duration_text = Math.round(duration_in_ms).toString();
        const spaces = new Array(35 - duration_text.length - name.length).fill('.').join('');
        const message = `${color.green(name)}${color.dim(spaces)}${duration_text} ${color.dim('ms')}`;
        if (env == 'production') {
            this.log(`${color.green('✓')} ${message}`);
        } else {
            if (!this.spinner) {
                this.start('name');
            }
            this.spinner.succeed(message);
            this.spinner = null;
        }
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
        if (typeof data == 'string' || typeof data == 'number' || typeof data == 'bigint') {
            return data.toString();
        }
        return JSON.stringify(data, null, 2);
    }
}
