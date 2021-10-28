import { join } from 'path';
import { File } from '@lib/file';
import { Mode } from '@lib/vars/mode';
import { WyvrMode } from '@lib/model/wyvr/mode';
import { uniq } from '@lib/helper/uniq';
import { Logger } from '@lib/logger';

export class UniqId {
    static uniq_id_file = join('cache', 'uniq.txt');
    static value = null;
    static get() {
        return this.value;
    }
    static set(value: string) {
        if (this.value !== value) {
            Logger.debug('persist UniqId', value)
            File.write(this.uniq_id_file, value);
        }
        this.value = value;
    }
    static load() {
        const mode = Mode.get();
        if (mode == null || isNaN(mode)) {
            return null;
        }
        let value = null;
        if ([WyvrMode.deliver, WyvrMode.cron].includes(mode)) {
            value = File.read(this.uniq_id_file);
            if (!value) {
                Logger.error('no previous version found in', this.uniq_id_file);
            }
        }
        return value;
    }
    static new() {
        return uniq();
    }
}
