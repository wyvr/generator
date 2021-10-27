import { WyvrMode } from '@lib/model/wyvr/mode';

export class Mode {
    static value: WyvrMode = null;
    static get(): WyvrMode {
        return this.value;
    }
    static set(value: WyvrMode) {
        this.value = value;
    }
}
