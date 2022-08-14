import kleur from 'kleur';
import { LogColor, LogFirstValueColor, LogIcon, LogType } from '../struc/log.js';
import {
    filled_array,
    filled_string,
    is_array,
    is_func,
    is_number,
    is_regex,
    is_string,
    is_symbol,
} from './validate.js';
import { stringify } from './json.js';
import { Env } from '../vars/env.js';
import { Report } from '../vars/report.js';
import { Spinner } from './spinner.js';
import { IsWorker } from '../vars/is_worker.js';
import { WorkerAction } from '../struc/worker_action.js';
import { to_plain } from './to.js';

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
        if (this.disable) {
            return;
        }
        if (IsWorker.get()) {
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
        const has_color_fn = is_func(color_fn);
        let text = messages.join(' ');
        if (has_color_fn) {
            text = color_fn(text);
        }
        let symbol = this.out(has_color_fn ? color_fn(char) : char);

        text = this.out(text);

        if (!this.spinner.persist(this.out(kleur.dim('│')), `${symbol} ${this.out(this.pre)}${text}`)) {
            const content = [symbol, text];
            if (this.inset) {
                content.unshift(this.out(kleur.dim('│')));
            }
            console.error(...content);
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
        if (IsWorker.get()) {
            return;
        }

        this.report_content.push([duration, ...messages]);
    }

    /**
     * Remove colors from the given string when Logger remove_color is true
     * @param {string} text
     * @returns the unstyled text or the original text
     */
    static out(text) {
        if (this.remove_color) {
            return to_plain(text);
        }
        return text;
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
        return stringify(data);
    }

    static start(name) {
        if (this.inset != name) {
            this.output_type('start', name);
        }
        this.inset = name;
        if (Env.is_dev()) {
            if (this.spinner) {
                this.spinner.start(name);
            }
        }
    }
    static stop(name, duration) {
        this.inset = false;
        if (this.spinner) {
            const result = this.spinner.stop(name, duration);
            if (result) {
                this.success(result);
            }
        }
    }
    static text(...values) {
        if (this.spinner) {
            const text = values.map(this.stringify).join(' ');
            this.spinner.update(text);
        }
    }
}
// static properties
Logger.pre = '';
Logger.spinner = Spinner;
Logger.color = kleur;
Logger.remove_color = false;
Logger.disable = false;
Logger.inset = false;
Logger.report_content = [];
