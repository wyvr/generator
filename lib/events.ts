import { IObject } from '@lib/interface/object';

export class Events {
    listeners: IObject = {};
    auto_increment = 0;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    on(scope: string, name: string | number, fn: (data: any) => void): number {
        const _scope = this.get_scope(scope);
        const _name = this.to_string(name);
        if (!this.listeners[_scope]) {
            this.listeners[_scope] = {};
        }
        if (!this.listeners[_scope][_name]) {
            this.listeners[_scope][_name] = [];
        }

        const id = this.auto_increment++;
        this.listeners[_scope][_name].push({ id, fn });
        return id;
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
    off(scope: string, name: string | number, index: number) {
        const _scope = this.get_scope(scope);
        const _name = this.to_string(name);
        if (this.listeners[_scope] && this.listeners[_scope][_name] && Array.isArray(this.listeners[_scope][_name])) {
            this.listeners[_scope][_name] = this.listeners[_scope][_name].filter((listener) => {
                return listener.id != index;
            });
        }
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    emit(scope: string, name: string | number, data: any = null) {
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
    /* eslint-enable @typescript-eslint/no-explicit-any */
    /* eslint-disable @typescript-eslint/no-explicit-any */
    once(scope: string, name: string | number, fn: (data: any) => void) {
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
    /* eslint-enable @typescript-eslint/no-explicit-any */

    to_string(name: string | number) {
        return name + '';
    }
    get_scope(scope: string) {
        if (!scope || typeof scope != 'string') {
            return '_';
        }
        return scope;
    }
}
