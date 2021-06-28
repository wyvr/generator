export class Events {
    listeners: any = {};
    auto_increment: number = 0;
    constructor() {}
    on(scope: string, name: string | number, fn: Function): number {
        if (!scope || typeof scope != 'string') {
            scope = '_';
        }
        name = this.to_string(name);
        if (!this.listeners[scope]) {
            this.listeners[scope] = {};
        }
        if (!this.listeners[scope][name]) {
            this.listeners[scope][name] = [];
        }

        const id = this.auto_increment++;
        this.listeners[scope][name].push({ id, fn });
        return id;
    }
    off(scope: string, name: string | number, index: number) {
        if(Array.isArray(this.listeners[scope][this.to_string(name)])) {
            this.listeners[scope][this.to_string(name)] = this.listeners[scope][this.to_string(name)].filter((listener) => {
                return listener.id != index;
            });
        }
    }
    emit(scope: string, name: string | number, data: any = null) {
        if (this.listeners[scope][this.to_string(name)]) {
            this.listeners[scope][this.to_string(name)].forEach((listener) => {
                if (!listener || typeof listener.fn != 'function') {
                    return;
                }
                listener.fn(data);
            });
        }
    }
    once(scope: string, name: string | number, fn: Function) {
        const index = this.on(scope, name, (...props) => {
            fn(...props);
            this.off(scope, name, index);
        });
    }
    to_string(name: string | number) {
        return name + '';
    }
}
