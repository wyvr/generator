import { join } from 'path';
import { Logger } from '@lib/logger';

export class RequireCache {
    static clear() {
        let amount = 0;
        Object.keys(require.cache).forEach((cache_file) => {
            if (this.matches(cache_file)) {
                amount++;
                delete require.cache[cache_file];
            }
        });
        Logger.debug('require cache cleared', amount, 'entries');
    }
    static matches(cache_file: string) {
        return cache_file.indexOf(join(process.cwd(), 'gen')) > -1 || cache_file.indexOf(join(process.cwd(), 'imported')) > -1;
    }
}
