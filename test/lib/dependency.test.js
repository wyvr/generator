require('module-alias/register');

describe('Lib/Dependency', () => {
    const assert = require('assert');
    const { Dependency } = require('@lib/dependency');

    before(() => {});

    beforeEach(() => {
        Dependency.cache = null;
    });

    describe('cache', () => {
        it('empty', () => {
            assert.deepStrictEqual(Dependency.cache, null);
        });
        it('new', () => {
            assert.deepStrictEqual(Dependency.new_cache(), {});
        });
    });
    describe('build', () => {
        it('undefined', () => {
            assert.deepStrictEqual(Dependency.build(), null);
            assert.deepStrictEqual(Dependency.cache, null);
        });
        it('null', () => {
            assert.deepStrictEqual(Dependency.build(null), null);
            assert.deepStrictEqual(Dependency.cache, null);
        });
        it('non existing', () => {
            assert.deepStrictEqual(Dependency.build('test/lib/file/nonexisting'), null);
            assert.deepStrictEqual(Dependency.cache, null);
        });
        it('existing', () => {
            assert.deepStrictEqual(Dependency.build('test/lib/file/folder'), []);
            assert.deepStrictEqual(Dependency.cache, {
                doc: {},
                layout: {},
                page: {},
            });
        });
        it('empty files', () => {
            assert.deepStrictEqual(Dependency.build('test/lib/file/svelte'), ['test/lib/file/svelte/a.svelte', 'test/lib/file/svelte/b/b.svelte']);
            assert.deepStrictEqual(Dependency.cache, {
                doc: {},
                layout: {},
                page: {},
            });
        });
        it('dependency', () => {
            assert.deepStrictEqual(Dependency.build('test/lib/dependency'), [
                'test/lib/dependency/a/b.svelte',
                'test/lib/dependency/a/c.svelte',
                'test/lib/dependency/a.svelte',
                'test/lib/dependency/doc/Default.svelte',
                'test/lib/dependency/layout/Default.svelte',
                'test/lib/dependency/page/Default.svelte',
            ]);
            // console.log(Dependency.cache);
            assert.deepStrictEqual(Dependency.cache, {
                doc: { 'doc/Default.svelte': ['a/b.svelte', 'a/c.svelte'] },
                layout: { 'layout/Default.svelte': ['a/b.svelte', 'a/c.svelte'] },
                page: { 'page/Default.svelte': ['a/b.svelte', 'a/c.svelte'] },
                'a': { 'a.svelte': ['a/b.svelte', 'a/c.svelte'] },
            });
        });
    });
    describe('extract_from_content', () => {
        it('empty', () => {
            Dependency.extract_from_content();
            assert.deepStrictEqual(Dependency.cache, null);
        });
        it('empty null,undefined,undefined', () => {
            Dependency.extract_from_content(null);
            assert.deepStrictEqual(Dependency.cache, null);
        });
        it('empty null,null,undefined', () => {
            Dependency.extract_from_content(null, null);
            assert.deepStrictEqual(Dependency.cache, null);
        });
        it('empty null,null,null', () => {
            Dependency.extract_from_content(null, null, null);
            assert.deepStrictEqual(Dependency.cache, null);
        });
        it('invalid null,null,content', () => {
            Dependency.extract_from_content(null, null, 'a');
            assert.deepStrictEqual(Dependency.cache, null);
        });
        it('no import', () => {
            Dependency.extract_from_content('root', 'parent', 'a');
            assert.deepStrictEqual(Dependency.cache, {});
        });
        it('ignore node_modules', () => {
            Dependency.extract_from_content('root', 'parent', `import { onMount } from 'svelte';
            import axios from 'axios';`);
            assert.deepStrictEqual(Dependency.cache, {});
        });
        it('import found @src', () => {
            Dependency.extract_from_content('root', 'parent', `import A from '@src/a.svelte'`);
            assert.deepStrictEqual(Dependency.cache, {
                root: {
                    parent: ['a.svelte'],
                },
            });
        });
        it('import found @src js default', () => {
            Dependency.extract_from_content('root', 'parent', `import A from '@src/a'`);
            assert.deepStrictEqual(Dependency.cache, { root: { parent: ['a'] } });
        });
        it('import found multiple @src', () => {
            Dependency.extract_from_content('root', 'parent', `import A from '@src/a.svelte', import B from '@src/b.svelte'`);
            assert.deepStrictEqual(Dependency.cache, {
                root: {
                    parent: ['a.svelte', 'b.svelte'],
                },
            });
        });
        it('import found relative path', () => {
            Dependency.extract_from_content(
                'root',
                'parent',
                `
            import A from './../a.svelte'; 
            import B from './b.svelte';
            import C from 'c.svelte';
            import D from '@src/d.svelte';
            `
            );
            assert.deepStrictEqual(Dependency.cache, {
                root: {
                    parent: ['../a.svelte', 'b.svelte', 'c.svelte', 'd.svelte'],
                },
            });
        });
    });
    describe('prepare', () => {
        it('empty', () => {
            const cache = Dependency.prepare();
            assert.deepStrictEqual(cache, {
                doc: {},
                layout: {},
                page: {},
            });
        });
        it('null', () => {
            const cache = Dependency.prepare(null);
            assert.deepStrictEqual(cache, {
                doc: {},
                layout: {},
                page: {},
            });
        });
        it('invalid types bool', () => {
            const cache = Dependency.prepare(true);
            assert.deepStrictEqual(cache, {
                doc: {},
                layout: {},
                page: {},
            });
        });
        it('invalid types string', () => {
            const cache = Dependency.prepare('hello');
            assert.deepStrictEqual(cache, {
                doc: {},
                layout: {},
                page: {},
            });
        });
        it('invalid types array', () => {
            const cache = Dependency.prepare(['hello']);
            assert.deepStrictEqual(cache, {
                doc: {},
                layout: {},
                page: {},
            });
        });
        it('doc defined', () => {
            const cache = Dependency.prepare({
                doc: {
                    test: ['huhu'],
                },
            });
            assert.deepStrictEqual(cache, {
                doc: {
                    test: ['huhu'],
                },
                layout: {},
                page: {},
            });
        });
        it('layout defined', () => {
            const cache = Dependency.prepare({
                layout: {
                    test: ['huhu'],
                },
            });
            assert.deepStrictEqual(cache, {
                doc: {},
                layout: {
                    test: ['huhu'],
                },
                page: {},
            });
        });
        it('page defined', () => {
            const cache = Dependency.prepare({
                page: {
                    test: ['huhu'],
                },
            });
            assert.deepStrictEqual(cache, {
                doc: {},
                layout: {},
                page: {
                    test: ['huhu'],
                },
            });
        });
        it('page defined', () => {
            const cache = Dependency.prepare({
                demo: {
                    test: ['huhu'],
                },
            });
            assert.deepStrictEqual(cache, {
                doc: {},
                layout: {},
                page: {},
                demo: {
                    test: ['huhu'],
                },
            });
        });
    });
});
