import { join } from 'path';
import { Logger } from './logger';

export class RequireCache {
    static clear() {
        let amount = 0;
        Object.keys(require.cache).forEach((cache_file) => {
            if (cache_file.indexOf(join(process.cwd(), 'gen')) > -1 || cache_file.indexOf(join(process.cwd(), 'imported')) > -1) {
                amount++;
                delete require.cache[cache_file];
            }
        });
        Logger.debug('require cache cleared', amount, 'entries');
    }
}
