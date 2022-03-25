import kleur from 'kleur';
import ora from 'ora';
import { is_string } from './validate.js';
import { Env } from '../vars/env.js';

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
        this.spinner.stopAndPersist({ text, symbol }).start(this.last_text).spinner = 'dots';
        return true;
    }
    static update(text) {
        if (this.spinner) {
            this.last_text = text;
            this.spinner.text = text;
        }
    }
    static stop(name, duration_in_ms) {
        const duration_text = Math.round(duration_in_ms).toString();
        const spaces = new Array(35 - duration_text.length - name.length).fill('.').join('');
        const message = `${kleur.green(name)} ${kleur.dim(spaces)} ${duration_text} ${kleur.dim('ms')}`;
        if (Env.is_prod()) {
            return `${kleur.green('✓')} ${message}`;
        }
        // create spinner when not already started
        if (!this.spinner) {
            this.spinner = this.create(name);
        }
        this.spinner.succeed(message);
        this.spinner = undefined;
        return;
    }
    static create(name) {
        if (!is_string(name)) {
            return undefined;
        }
        return ora(name).start();
    }
}
Spinner.spinner = undefined;
Spinner.last_text = '';
