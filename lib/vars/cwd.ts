export class Cwd {
    static value = null;
    static get() {
        return this.value;
    }
    static set(value: string) {
        this.value = value;
    }
}