import { deepStrictEqual } from 'assert';
import { after, describe, it } from 'mocha';
import { WatcherPaths } from '../../src/vars/watcher_paths.js';

describe('vars/watcher_paths', () => {
    after(() => {
        WatcherPaths.set({});
    });
    it('undefined', () => {
        WatcherPaths.set();
        deepStrictEqual(WatcherPaths.get(), undefined);
    });
    it('custom value', () => {
        WatcherPaths.set({});
        deepStrictEqual(WatcherPaths.get(), {});
    });
    it('wrong type', () => {
        WatcherPaths.set('huhu');
        deepStrictEqual(WatcherPaths.get(), {});
    });
    it('set paths', () => {
        WatcherPaths.set_path('a', 'path/a');
        deepStrictEqual(WatcherPaths.get(), { a: 'path/a' });
        WatcherPaths.set_path('b', 'path/b');
        deepStrictEqual(WatcherPaths.get(), { a: 'path/a', b: 'path/b' });
    });
});
