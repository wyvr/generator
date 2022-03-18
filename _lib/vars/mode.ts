import { ModeType } from '@lib/struc/mode';

export class Mode {
    static value: ModeType = null;
    static get(): ModeType {
        return this.value;
    }
    static set(value: ModeType) {
        this.value = value;
    }
}
