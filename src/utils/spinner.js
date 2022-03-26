import kleur from 'kleur';
import ora from 'ora';
import { filled_string, is_number, is_string } from './validate.js';
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
        const message = [];
        if(!filled_string(name)) {
            name = '';
        }
        message.push(kleur.green(name))
        
        let duration_text = '';
        if(is_number(duration_in_ms)) {
            duration_text = Math.round(duration_in_ms).toString();
        }
        const length = Math.max(0, 35 - duration_text.length - name.length);
        const spaces = new Array(length).fill('.').join('');
        
        message.push(kleur.dim(spaces))
        if(duration_text) {
            message.push(duration_text)
            message.push(kleur.dim('ms'))
        }
        if (Env.is_prod()) {
            return `${kleur.green('✓')} ${message.join(' ')}`;
        }
        // create spinner when not already started
        if (!this.spinner) {
            this.spinner = this.create(name);
            if(!this.spinner) {
                return;
            }
        }
        this.spinner.succeed(message.join(' '));
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
