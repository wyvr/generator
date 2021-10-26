import { join } from 'path';
import { Logger } from '@lib/logger';
import { Cwd } from '@lib/vars/cwd';

export class RequireCache {
    /**
     * Removes wyvr elements from the node.js require cache
     * @returns amount of removed entries from require cache
     */
    static clear(): number {
        let amount = 0;
        Object.keys(require.cache).forEach((cache_file) => {
            if (this.matches(cache_file)) {
                amount++;
                delete require.cache[cache_file];
            }
        });
        Logger.debug('require cache cleared', amount, 'entries');
        return amount;
    }
    /**
     * Returns whether the file should be removed from the cache or not
     * @param cache_file absolute path of an cache file(key)
     * @returns boolean
     */
    static matches(cache_file: string): boolean {
        return cache_file.indexOf(join(Cwd.get(), 'gen')) > -1;
    }
}
