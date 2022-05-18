import kleur from 'kleur';
import ora from 'ora';
import { filled_string, is_number, is_string } from './validate.js';
import { Env } from '../vars/env.js';
import { to_plain } from './to.js';

export class Spinner {
    static start(name) {
        if (Env.is_dev()) {
            this.last_text = name || '';
            this.spinner = this.create(name);
        }
    }
    static persist(symbol, text) {
        if (!this.spinner) {
            return false;
        }
        this.spinner = this.spinner.stopAndPersist({ text, symbol }).start(this.last_text);
        this.spinner.spinner = 'dots';
        this.spinner.color = this.remove_color ? 'white' : 'blue';
        return true;
    }
    static update(text) {
        if (this.spinner) {
            this.last_text = text;
            this.spinner.text = text;
        }
    }
    static stop(name, duration_in_ms) {
        const message = [];
        if (!filled_string(name)) {
            name = '';
        }
        message.push(kleur.green(name));

        let duration_text = '';
        if (is_number(duration_in_ms)) {
            duration_text = Math.round(duration_in_ms).toString();
        }
        const length = Math.max(0, 35 - duration_text.length - name.length);
        const spaces = new Array(length).fill('.').join('');

        message.push(kleur.dim(spaces));
        if (duration_text) {
            message.push(duration_text);
            message.push(kleur.dim('ms'));
        }
        const text = this.out(message.join(' '));
        if (Env.is_prod()) {
            return text;
        }
        // create spinner when not already started
        if (!this.spinner) {
            this.spinner = this.create(name);
            if (!this.spinner) {
                return;
            }
        }
        this.spinner.succeed(text);
        this.spinner = undefined;
        return;
    }
    static create(name) {
        if (!is_string(name)) {
            return undefined;
        }
        /* c8 ignore next */
        return ora(name).start();
    }
    /**
     * Remove colors from the given string when Spinner remove_color is true
     * @param {string} text
     * @returns the unstyled text or the original text
     */
     static out(text) {
        if(this.remove_color) {
            return to_plain(text);
        }
        return text;
    }
}
Spinner.spinner = undefined;
Spinner.last_text = '';
Spinner.remove_color = false;
