import { is_null, filled_string } from "./validate.js";

export class Event {
    static on(scope, name, fn) {
        const _scope = this.get_scope(scope);
        const _name = this.to_string(name);
        if (is_null(this.listeners[_scope])) {
            this.listeners[_scope] = {};
        }
        if (!this.listeners[_scope][_name]) {
            this.listeners[_scope][_name] = [];
        }

        const id = this.auto_increment++;
        this.listeners[_scope][_name].push({ id, fn });
        return id;
    }
    static off(scope, name, index) {
        const _scope = this.get_scope(scope);
        const _name = this.to_string(name);
        if (this.listeners[_scope] && this.listeners[_scope][_name] && Array.isArray(this.listeners[_scope][_name])) {
            this.listeners[_scope][_name] = this.listeners[_scope][_name].filter((listener) => {
                return listener.id != index;
            });
        }
    }
    static emit(scope, name, data = null) {
        const _scope = this.get_scope(scope);
        const _name = this.to_string(name);
        if (this.listeners[_scope] && this.listeners[_scope][_name] && Array.isArray(this.listeners[_scope][_name])) {
            this.listeners[_scope][_name].forEach((listener) => {
                if (!listener || typeof listener.fn != 'function') {
                    return;
                }
                listener.fn(data);
            });
        }
    }
    static once(scope, name, fn) {
        if (!fn || typeof fn != 'function') {
            return;
        }
        const _scope = this.get_scope(scope);
        const _name = this.to_string(name);
        const index = this.on(_scope, _name, (...props) => {
            fn(...props);
            this.off(_scope, _name, index);
        });
    }

    static to_string(name) {
        return name + '';
    }
    static get_scope(scope) {
        if (!filled_string(scope)) {
            return '_';
        }
        return scope;
    }
}
Event.listeners = {};
Event.auto_increment = 0;
