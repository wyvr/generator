import { Cwd } from '@lib/vars/cwd';
import { join } from 'path';

export class RootTemplatePaths {
    static value = null;
    static get() {
        if (!this.value) {
            const raw_path = join(Cwd.get(), 'gen', 'raw');
            this.value = [join(raw_path, 'doc'), join(raw_path, 'layout'), join(raw_path, 'page')];
        }
        return this.value;
    }
}
