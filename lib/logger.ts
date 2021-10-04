const pkg = require('@root/package.json');
const circular = require('circular');
import * as color from 'ansi-colors';
import ora from 'ora';
import { EnvModel } from '@lib/model/env';

export class Logger {
    static color = color;
    static spinner = null;
    static last_text = null;
    static env = process.env.WYVR_ENV || 'development';
    static show_report = process.env.WYVR_REPORT != null;
    static set_env(env: string) {
        if (['development', 'debug', 'production'].indexOf(env) == -1) {
            return;
        }
        this.env = env;
    }
    static create_spinner(name: string) {
        return ora(name).start();
    }

    static output(color_fn: Function | null, char: string, ...values: any[]) {
        let text = values
            .map(this.stringify)
            .filter((x) => x)
            .map((v) => (color_fn ? color_fn(v) : v))
            .join(' ');
        const symbol = color_fn ? color_fn(char) : char;
        if (this.spinner) {
            this.spinner.stopAndPersist({ text: `${symbol} ${text}`, symbol: color.dim('│') }).start(this.last_text).spinner = 'dots';
            return;
        }
        console.log(symbol, text);
    }
    static log(...values) {
        this.output(null, '', ...values);
    }
    static present(key, ...values) {
        this.output(null, color.dim('-'), key, color.green(values.shift()), ...values);
    }
    static info(key, ...values) {
        this.output(null, color.cyan('i'), key, color.cyan(values.shift()), ...values);
    }
    static success(key, ...values) {
        this.output(null, color.green('✓'), key, color.green(values.shift()), ...values);
    }
    static warning(...values) {
        this.output(color.yellow, '⚠', ...values);
    }
    static error(...values) {
        this.output(color.red, '✘', ...values);
    }
    static improve(...values) {
        this.output(color.magenta, '⚡️', ...values);
    }
    static report(duration, ...values) {
        if (this.show_report) {
            this.output(color.yellow, '#', ...values, duration, color.dim('ms'));
        }
    }
    static block(...values) {
        this.output(color.cyan, '■', ...values);
    }
    static debug(...values) {
        if (this.env != 'debug') {
            return;
        }
        this.output(color.dim, '~', ...values);
    }
    static start(name: string) {
        if (this.env != 'production') {
            this.last_text = name || '';
            this.output(color.dim, '┌', name);
            this.spinner = this.create_spinner(name);
        }
    }
    static text(...values) {
        if (this.spinner) {
            const text = values.map(this.stringify).join(' ');
            this.last_text = text;
            this.spinner.text = text;
        }
    }
    static stop(name: string, duration_in_ms: number = null) {
        let duration_text = Math.round(duration_in_ms).toString();
        const spaces = new Array(35 - duration_text.length - name.length).fill('.').join('');
        const message = `${color.green(name)}${color.dim(spaces)}${duration_text} ${color.dim('ms')}`;
        if (this.env == 'production') {
            this.log(null, `${color.green('✓')} ${message}`);
        } else {
            if (!this.spinner) {
                this.spinner = this.create_spinner(name);
            }
            this.spinner.succeed(message);
            this.spinner = null;
        }
    }
    static logo() {
        const logo = [`__  __  __  __  __  ____`, `\\ \\/ /\\/ /\\/ /\\/ /\\/ /_/`, ` \\/_/\\/_/\\/ /\\/_/\\/_/`, `         /_/ generator ${color.dim(pkg.version)}`].join('\n');
        console.log(color.cyan(logo));
        console.log('');
    }

    static stringify(data: any): string {
        if (typeof data == 'string' || typeof data == 'number' || typeof data == 'bigint') {
            return data.toString();
        }
        return JSON.stringify(data, circular());
    }
}
