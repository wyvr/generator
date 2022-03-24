import cluster from 'cluster';
import kleur from 'kleur';
import ora from 'ora';
import { LogType } from '../struc/log.js';
import { filled_string, is_array, is_date, is_number, is_object, is_regex, is_string, is_symbol } from './validate.js';
import circular from 'circular';

export class Logger {
    /**
     * Create new instance of the Logger
     * @param {string} name
     * @returns Creates a new instance of the Logger with a preppended hint
     */
    static create(name) {
        /* eslint-disable */
        /* eslint-enable */
        const clone = new Logger();
        if (!filled_string(name)) {
            name = '~';
        }
        clone.pre = kleur.dim(`[${name}]`);
        return clone;
    }

    static prepare_message(values) {
        if (!is_array(values)) {
            return [];
        }
        return values.map(this.stringify).filter((x) => x);
    }

    /* eslint-disable */
    static output(type, color_fn, char, ...messages) {
        if (cluster.isWorker) {
            if (this.pre) {
                messages.unshift(this.pre);
            }
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
            this.spinner
                .stopAndPersist({ text: `${symbol} ${this.pre}${text}`, symbol: kleur.dim('│') })
                .start(this.last_text).spinner = 'dots';
            return;
        }
        console.log(symbol, text);
    }
    /* eslint-enable */

    static log(...values) {
        const messages = this.prepare_message(values);
        this.output(LogType.log, undefined, '', ...messages);
    }
    static present(key, ...values) {
        const messages = this.prepare_message(values).map((value, index) => {
            if (index == 0) {
                return kleur.green(value);
            }
            return value;
        });
        this.output(LogType.present, null, kleur.dim('-'), key, ...messages);
    }
    static info(key, ...values) {
        const messages = this.prepare_message(values).map((value, index) => {
            if (index == 0) {
                return kleur.blue(value);
            }
            return value;
        });
        this.output(LogType.info, null, kleur.blue('ℹ'), key, ...messages);
    }
    static success(key, ...values) {
        const messages = this.prepare_message(values).map((value, index) => {
            if (index == 0) {
                return kleur.green(value);
            }
            return value;
        });
        this.output(LogType.success, null, kleur.green('✔'), key, ...messages);
    }
    static warning(...values) {
        const messages = this.prepare_message(values);
        this.output(LogType.warning, kleur.yellow, '⚠', ...messages);
    }
    static error(...values) {
        const messages = this.prepare_message(values);
        this.output(LogType.error, kleur.red, '✖', ...messages);
    }
    static improve(...values) {
        const messages = this.prepare_message(values);
        this.output(LogType.improve, kleur.magentaBright, '»', ...messages);
    }
    static report(duration, ...values) {
        const messages = this.prepare_message(values);
        if (this.show_report) {
            if (cluster.isWorker) {
                this.output(LogType.report, kleur.yellow, '#', duration, ...messages, kleur.dim('ms'));
                return;
            }
            this.output(LogType.report, kleur.yellow, '#', ...messages, duration, kleur.dim('ms'));

            this.report_content.push([duration, ...messages]);
        }
    }
    static block(...values) {
        const messages = this.prepare_message(values);
        this.output(LogType.block, kleur.blue, '■', ...messages);
    }
    static debug(...values) {
        if (this.env != 'debug') {
            return;
        }
        const messages = this.prepare_message(values);
        this.output(LogType.debug, kleur.dim, '~', ...messages);
    }
    static start(name) {
        if (this.env != 'production') {
            this.last_text = name || '';
            this.output(LogType.start, kleur.dim, '┌', name);
            this.spinner = this.create_spinner(name);
        }
    }
    static text(...values) {
        if (this.spinner) {
            const text = this.prepare_message(values).join(' ');
            this.last_text = text;
            this.spinner.text = text;
        }
    }
    static stop(name, duration_in_ms = null) {
        const duration_text = Math.round(duration_in_ms).toString();
        const spaces = new Array(35 - duration_text.length - name.length).fill('.').join('');
        const message = `${kleur.green(name)} ${kleur.dim(spaces)} ${duration_text} ${kleur.dim('ms')}`;
        if (this.env == 'production') {
            this.log(null, `${kleur.green('✓')} ${message}`);
        } else {
            if (!this.spinner) {
                this.spinner = this.create_spinner(name);
            }
            this.spinner.succeed(message);
            this.spinner = null;
        }
    }

    /**
     * Remove CLI ANSI Colors from the given string
     * @param {string} text
     * @returns the unstyled text
     */
    static unstyle(text) {
        if (!is_string(text)) {
            return '';
        }
        /* eslint-disable no-control-regex */
        // @see https://github.com/doowb/ansi-colors/blob/master/index.js ANSI_REGEX
        return text.replace(
            /[\u001b\u009b][[\]#;?()]*(?:(?:(?:[^\W_]*;?[^\W_]*)\u0007)|(?:(?:[0-9]{1,4}(;[0-9]{0,4})*)?[~0-9=<>cf-nqrtyA-PRZ]))/g,
            ''
        );
        /* eslint-enable no-control-regex */
    }

    /**
     * convert the element to json
     * @param {any} data
     * @returns
     */
    /* eslint-disable */
    static stringify(data) {
        if (is_string(data) || is_number(data) || is_symbol(data) || is_regex(data)) {
            return data.toString();
        }
        return JSON.stringify(data, circular());
    }
    /* eslint-enable */

    static create_spinner(name) {
        if (!is_string(name)) {
            return undefined;
        }
        return ora(name).start();
    }
}
// static properties
Logger.pre = '';
Logger.spinner = undefined;
Logger.color = kleur;
Logger.last_text = null;
// Logger.show_report = process.env.WYVR_REPORT != null;
Logger.report_content = [];
