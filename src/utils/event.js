import { to_string } from './to.js';
import { is_null, filled_string, is_array, is_func } from './validate.js';
// biome-ignore lint/complexity/noStaticOnlyClass: to keep track of the listeners
export class Event {
    static on(scope, name, fn) {
        const _scope = Event.get_scope(scope);
        const _name = to_string(name);
        if (is_null(Event.listeners[_scope])) {
            Event.listeners[_scope] = {};
        }
        if (!Event.listeners[_scope][_name]) {
            Event.listeners[_scope][_name] = [];
        }

        // theoretically possible to overflow the number type
        const id = Event.auto_increment++;
        Event.listeners[_scope][_name].push({ id, fn });
        return id;
    }
    static off(scope, name, index) {
        setTimeout(() => {
            Event.off_instant(scope, name, index);
        }, 50);
    }
    static off_instant(scope, name, index) {
        const _scope = Event.get_scope(scope);
        const _name = to_string(name);
        if (Event.exists(_scope, _name)) {
            Event.listeners[_scope][_name] = Event.listeners[_scope][_name].filter((listener) => {
                return listener.id !== index;
            });
        }
    }
    static emit(scope, name, data = null) {
        const _scope = Event.get_scope(scope);
        const _name = to_string(name);
        if (Event.exists(_scope, _name)) {
            for (const listener of Event.listeners[_scope][_name]) {
                if (!listener || !is_func(listener.fn)) {
                    continue;
                }
                listener.fn(data);
            }
        }
    }
    static once(scope, name, fn) {
        if (!is_func(fn)) {
            return;
        }
        const _scope = Event.get_scope(scope);
        const _name = to_string(name);
        const index = Event.on(_scope, _name, (...props) => {
            fn(...props);
            Event.off_instant(_scope, _name, index, true);
        });
    }

    static get_scope(scope) {
        if (!filled_string(scope)) {
            return '_';
        }
        return scope;
    }

    static exists(scope, name) {
        const exists = is_array(Event.listeners[scope]?.[name]);
        return !!exists;
    }
}
Event.listeners = {};
Event.auto_increment = 0;
