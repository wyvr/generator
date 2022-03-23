export class Logger {
    static pre = '';
    static color = color;
    static spinner = null;
    static last_text = null;
    static env = process.env.WYVR_ENV || 'development';
    static show_report = process.env.WYVR_REPORT != null;
    static report_content = [];
    static create(name = '') {
        /* eslint-disable */
        const clone: any = {};
        Object.keys(Logger).forEach((key) => {
            clone[key] = Logger[key];
        });
        clone.pre = this.color.dim(`[${name}]`);
        /* eslint-enable */
        return clone;
    }
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
                .stopAndPersist({ text: `${symbol} ${this.pre}${text}`, symbol: color.dim('│') })
                .start(this.last_text).spinner = 'dots';
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
        this.output(LogType.improve, color.magentaBright, '»', ...values);
    }
    static report(duration, ...values) {
        if (this.show_report) {
            if (cluster.isWorker) {
                this.output(LogType.report, color.yellow, '#', duration, ...values, color.dim('ms'));
                return;
            }
            this.output(LogType.report, color.yellow, '#', ...values, duration, color.dim('ms'));

            this.report_content.push([duration, ...values]);
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

    /* eslint-disable */
    static stringify(data: any): string {
        if (typeof data == 'string' || typeof data == 'number' || typeof data == 'bigint') {
            return data.toString();
        }
        return JSON.stringify(data, circular());
    }
    /* eslint-enable */

    static write_report() {
        if (this.show_report) {
            File.write(
                join('gen', 'report.csv'),
                '"ms","...values"\n' +
                    this.report_content
                        .map(
                            (line) =>
                                `"${line
                                    .map((col) => color.unstyle(col))
                                    .filter((col) => col != 'ms' && !col.match(/^PID \d+$/))
                                    .join('","')}"`
                        )
                        .join('\n')
            );
            this.warning('report file', join('gen', 'report.csv'));
        }
    }
}
