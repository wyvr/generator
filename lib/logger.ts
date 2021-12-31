import circular from 'circular';
import * as color from 'ansi-colors';
import ora from 'ora';
import { WorkerAction } from '@lib/model/worker/action';
import cluster from 'cluster';
import { LogType } from '@lib/model/log';
import { File } from '@lib/file';
import { join } from 'path';

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
    /* eslint-disable */
    static output(type: number | LogType, color_fn: (text: string) => string | null, char: string, ...values: any[]) {
        const messages = values.map(this.stringify).filter((x) => x);

        if (cluster.isWorker) {
            process.send({
                pid: process.pid,
                data: {
                    action: {
                        key: WorkerAction.log,
                        value: {
                            type,
                            messages,
                        },
                    },
                },
            });
            return;
        }
        const has_color_fn = color_fn && typeof color_fn == 'function';
        const text = messages.map((v) => (has_color_fn ? color_fn(v) : v)).join(' ');
        const symbol = has_color_fn ? color_fn(char) : char;

        if (this.spinner) {
            this.spinner.stopAndPersist({ text: `${symbol} ${text}`, symbol: color.dim('│') }).start(this.last_text).spinner = 'dots';
            return;
        }
        console.log(symbol, text);
    }
    /* eslint-enable */
    static log(...values) {
        this.output(LogType.log, null, '', ...values);
    }
    static present(key, ...values) {
        this.output(LogType.present, null, color.dim('-'), key, color.green(values.shift()), ...values);
    }
    static info(key, ...values) {
        this.output(LogType.info, null, color.cyan('i'), key, color.cyan(values.shift()), ...values);
    }
    static success(key, ...values) {
        this.output(LogType.success, null, color.green('✓'), key, color.green(values.shift()), ...values);
    }
    static warning(...values) {
        this.output(LogType.warning, color.yellow, '⚠', ...values);
    }
    static error(...values) {
        this.output(LogType.error, color.red, '✘', ...values);
    }
    static improve(...values) {
        this.output(LogType.improve, color.magentaBright, '⚡️', ...values);
    }
    static report(duration, ...values) {
        if (this.show_report) {
            this.output(LogType.report, color.yellow, '#', ...values, duration, color.dim('ms'));
        }
    }
    static block(...values) {
        this.output(LogType.block, color.cyan, '■', ...values);
    }
    static debug(...values) {
        if (this.env != 'debug') {
            return;
        }
        this.output(LogType.debug, color.dim, '~', ...values);
    }
    static start(name: string) {
        if (this.env != 'production') {
            this.last_text = name || '';
            this.output(LogType.start, color.dim, '┌', name);
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
        const duration_text = Math.round(duration_in_ms).toString();
        const spaces = new Array(35 - duration_text.length - name.length).fill('.').join('');
        const message = `${color.green(name)} ${color.dim(spaces)} ${duration_text} ${color.dim('ms')}`;
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
        const pkg = File.read_json(join(__dirname, '..', 'package.json'));
        const version = pkg ? pkg.version : 'missing version';
        const logo = [`__  __  __  __  __  ____`, `\\ \\/ /\\/ /\\/ /\\/ /\\/ /_/`, ` \\/_/\\/_/\\/ /\\/_/\\/_/`, `         /_/ generator ${color.dim(version)}`].join('\n');
        /* eslint-disable */
        console.log(color.cyan(logo));
        console.log('');
        /* eslint-enable */
    }
    
    /* eslint-disable */
    static stringify(data: any): string {
        if (typeof data == 'string' || typeof data == 'number' || typeof data == 'bigint') {
            return data.toString();
        }
        return JSON.stringify(data, circular());
    }
    /* eslint-enable */
}
