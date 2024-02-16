export class Report {
    static get() {
        return !!this.value;
    }
    static set(value) {
        this.value = !!value;
        return this.get();
    }
}
