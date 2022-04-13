import cluster from 'cluster';
import kleur from 'kleur';
import { LogColor, LogFirstValueColor, LogIcon, LogType } from '../struc/log.js';
import { filled_array, filled_string, is_array, is_func, is_number, is_regex, is_string, is_symbol } from './validate.js';
import circular from 'circular';
import { Env } from '../vars/env.js';
import { Report } from '../vars/report.js';
import { Spinner } from './spinner.js';

export class Logger {
    /**
     * Create new instance of the Logger
     * @param {string} name
     * @returns Creates a new instance of the Logger with a preppended hint
     */
    static create(name, spinner) {
        const clone = Object.create(Object.getPrototypeOf(Logger), Object.getOwnPropertyDescriptors(Logger));
        if (!filled_string(name)) {
            name = '~';
        }
        clone.pre = kleur.dim(`[${name}]`);
        if (spinner) {
            clone.spinner = spinner;
        }
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
        // if (cluster.isWorker) {
        //     if (this.pre) {
        //         messages.unshift(this.pre);
        //     }
        //     process.send({
        //         pid: process.pid,
        //         data: {
        //             action: {
        //                 key: WorkerAction.log,
        //                 value: {
        //                     type,
        //                     messages,
        //                 },
        //             },
        //         },
        //     });
        //     return;
        // }
        const has_color_fn = is_func(color_fn);
        let text = messages.join(' ');
        if (has_color_fn) {
            text = color_fn(text);
        }
        const symbol = has_color_fn ? color_fn(char) : char;

        if (!this.spinner.persist(kleur.dim('│'), `${symbol} ${this.pre}${text}`)) {
            console.error(symbol, text);
        }
    }
    /* eslint-enable */

    static output_type(type, key, ...values) {
        let messages = this.prepare_message(values);
        if (LogFirstValueColor[type]) {
            messages = messages.map((value, index) => {
                if (index == 0) {
                    return LogFirstValueColor[type](value);
                }
                return value;
            });
        }
        if (key) {
            messages.unshift(key);
        }
        if (LogIcon[type]) {
            messages.unshift(LogIcon[type]);
        }
        if (filled_array(messages)) {
            this.output(LogType[type], LogColor[type], ...messages);
            return;
        }
        this.output(LogType[type], LogColor[type], '');
    }

    static log(...values) {
        this.output_type('log', ...values);
    }
    static present(key, ...values) {
        this.output_type('present', key, ...values);
    }
    static info(key, ...values) {
        this.output_type('info', key, ...values);
    }
    static success(key, ...values) {
        this.output_type('success', key, ...values);
    }
    static warning(...values) {
        this.output_type('warning', ...values);
    }
    static error(...values) {
        this.output_type('error', ...values);
    }
    static improve(...values) {
        this.output_type('improve', ...values);
    }
    static block(...values) {
        this.output_type('block', ...values);
    }
    static debug(...values) {
        if (!Env.is_debug()) {
            return;
        }
        this.output_type('debug', ...values);
    }
    static report(duration, ...values) {
        const messages = this.prepare_message(values);
        if (!Report.get() || !duration) {
            return;
        }
        this.output_type('report', ...messages, duration, kleur.dim('ms'));
        if (cluster.isWorker) {
            return;
        }

        this.report_content.push([duration, ...messages]);
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
    static stringify(data) {
        if (is_string(data) || is_number(data) || is_symbol(data) || is_regex(data)) {
            return data.toString();
        }
        return JSON.stringify(data, circular());
    }

    static start(name) {
        if (Env.is_dev()) {
            this.output_type('start', name);
            if (this.spinner) {
                this.spinner.start(name);
            }
        }
    }
    static stop(name, duration) {
        if (this.spinner) {
            this.spinner.stop(name, duration);
        }
    }
}
// static properties
Logger.pre = '';
Logger.spinner = Spinner;
Logger.color = kleur;
Logger.last_text = null;
Logger.report_content = [];
