export class SocketPort {
    static value = undefined;
    static get(): number {
        return this.value;
    }
    static set(value: number) {
        this.value = value;
    }
}