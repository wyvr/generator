import kleur from 'kleur';
import { LogColor, LogFirstValueColor, LogIcon, LogType, get_type_name } from '../struc/log.js';
import { filled_array, filled_string, is_array, is_func, is_number, is_regex, is_string, is_symbol } from './validate.js';
import { stringify } from './json.js';
import { Env } from '../vars/env.js';
import { Report } from '../vars/report.js';
import { Spinner } from './spinner.js';
import { IsWorker } from '../vars/is_worker.js';
import { WorkerAction } from '../struc/worker_action.js';
import { to_plain } from './to.js';
import { Event } from './event.js';
import { append } from './file.js';

/**
 * `Logger` is a class that provides static methods for logging purposes.
 *
 * @class Logger
 *
 */

// biome-ignore lint/complexity/noStaticOnlyClass: to make it easier to use the logger class
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

    /**
     * Prepare messages for output. Converts all elements in the input array into strings and filters out empty values.
     *
     * @param values - The array containing values to prepare for output.
     * @returns An array of prepared message strings.
     */
    static prepare_message(values) {
        if (!is_array(values)) {
            return [];
        }
        // biome-ignore lint/complexity/noThisInStatic: <explanation>
        return values.map(this.stringify).filter((x) => x);
    }

    /**
     * Output formatted logs to console or emits an event if set so. Can also handle logs from worker processes.
     *
     * @param type - Type of log.
     * @param color_fn - Color function for styling the log.
     * @param char - Leading character(s) for the log.
     * @param {...any} messages - Messages to output in the log.
     */
    /* eslint-disable */
    static output(type, color_fn, char, ...messages) {
        if (this.emit) {
            Event.emit('logger', type, { char: to_plain(char), message: messages.map(to_plain) });
        }
        /* c8 ignore start */
        // write messages to log file
        if (this.log_file) {
            if (type >= this.log_level) {
                append(this.log_file, `[${this.get_time_stamp()}] ${this.get_log_name(type)}: ${to_plain(messages.join(' '))}\n`);
            }
        }
        /* c8 ignore end */
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
                            messages
                        }
                    }
                }
            });
            return;
        }
        const has_color_fn = is_func(color_fn);
        let text = messages.join(' ');
        if (has_color_fn) {
            text = color_fn(text);
        }
        const symbol = this.out(has_color_fn ? color_fn(char) : char);

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

    /**
     * Helper method to output messages based on their type.
     *
     * @param type - Type of log.
     * @param key - Key of the message.
     * @param {...any} values - Values to be output.
     */
    static output_type(type, key, ...values) {
        let messages = this.prepare_message(values);
        if (LogFirstValueColor[type]) {
            messages = messages.map((value, index) => {
                if (index === 0) {
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
        this.output_type('log', '-', ...values);
    }
    static raw_log(...values) {
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
     * Converts the input data into a string representation.
     * @param {any} data
     * @returns
     */
    static stringify(data) {
        if (is_string(data) || is_number(data) || is_symbol(data) || is_regex(data)) {
            return data.toString();
        }
        return stringify(data);
    }

    /**
     * Starts logging group with a specified name and spinner.
     *
     * @param {string} name - Name of the log.
     */
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

    /**
     * Stops logging group with a specified name and duration and stops any associated spinner.
     *
     * @param {string} name - Name of the log.
     * @param duration - Duration of the log.
     */
    static stop(name, duration) {
        this.inset = false;
        if (this.spinner) {
            const result = this.spinner.stop(name, duration);
            if (result) {
                this.success(result);
            }
        }
    }

    /**
     * Sets spinner text with the provided values.
     *
     * @param {...any} values - Values to set as text on the spinner.
     */
    static text(...values) {
        if (this.spinner) {
            const text = values.map(this.stringify).join(' ');
            this.spinner.update(text);
        }
    }

    static get_log_name(type) {
        const name = get_type_name(type);
        if (!name) {
            return '<?>';
        }
        return name.substring(0, 4).toUpperCase().padEnd(4, ' ');
    }

    static get_time_stamp() {
        const date = new Date();
        const short = (v) => v.toString().padStart(2, '0');
        return `${date.getFullYear().toString().substring(2)}-${short(date.getMonth() + 1)}-${short(date.getDate())} ${short(date.getHours())}:${short(date.getMinutes())}:${short(
            date.getSeconds()
        )}`;
    }
}
/**
 * These properties are defaults for the Logger class and can be overridden by child instances.
 */
Logger.pre = ''; // Prefix for the log messages
Logger.spinner = Spinner; // Default spinner object
Logger.color = kleur; // Default color schema
Logger.remove_color = false; // Default flag to remove color from output
Logger.disable = false; // Default flag to disable logging
Logger.inset = false; // Flag to indicate if a particular log is inset or not
Logger.emit = false; // Flag to determine if log events should be emitted
Logger.report_content = []; // Array to store report logs
Logger.log_level = LogType.log; // min log level
Logger.log_file = undefined; // log file
