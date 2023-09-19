import { to_string } from './to.js';
import { is_null, filled_string, is_array, is_func } from './validate.js';

export class Event {
    static on(scope, name, fn) {
        const _scope = this.get_scope(scope);
        const _name = to_string(name);
        if (is_null(this.listeners[_scope])) {
            this.listeners[_scope] = {};
        }
        if (!this.listeners[_scope][_name]) {
            this.listeners[_scope][_name] = [];
        }

        // theoretically possible to overflow the number type
        const id = this.auto_increment++;
        this.listeners[_scope][_name].push({ id, fn });
        return id;
    }
    static off(scope, name, index) {
        setTimeout(() => {
            this.off_instant(scope, name, index);
        }, 50);
    }
    static off_instant(scope, name, index) {
        const _scope = this.get_scope(scope);
        const _name = to_string(name);
        if (this.exists(_scope, _name)) {
            this.listeners[_scope][_name] = this.listeners[_scope][_name].filter((listener) => {
                return listener.id != index;
            });
        }
    }
    static emit(scope, name, data = null) {
        const _scope = this.get_scope(scope);
        const _name = to_string(name);
        if (this.exists(_scope, _name)) {
            this.listeners[_scope][_name].forEach((listener) => {
                if (!listener || !is_func(listener.fn)) {
                    return;
                }
                listener.fn(data);
            });
        }
    }
    static once(scope, name, fn) {
        if (!is_func(fn)) {
            return;
        }
        const _scope = this.get_scope(scope);
        const _name = to_string(name);
        const index = this.on(_scope, _name, (...props) => {
            fn(...props);
            this.off_instant(_scope, _name, index, true);
        });
    }

    static get_scope(scope) {
        if (!filled_string(scope)) {
            return '_';
        }
        return scope;
    }

    static exists(scope, name) {
        const exists = this.listeners[scope] && this.listeners[scope][name] && is_array(this.listeners[scope][name]);
        return !!exists;
    }
}
Event.listeners = {};
Event.auto_increment = 0;
