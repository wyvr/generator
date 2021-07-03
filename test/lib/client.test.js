const { readFileSync } = require('fs');

require('module-alias/register');

describe('Lib/Client', () => {
    const assert = require('assert');
    const { Client } = require('@lib/client');
    const { WyvrFileConfig } = require('@lib/model/wyvr/file');
    const cwd = process.cwd();

    before(() => {});
    describe('create_bundle', () => {
        // it('', ()=>{})
    });
    describe('process_bundle', () => {
        // it('', ()=>{})
    });
    describe('correct_svelte_file_import_paths', () => {
        // it('', ()=>{})
    });
    describe('get_hydrateable_svelte_files', () => {
        // it('', ()=>{})
    });
    describe('parse_wyvr_config', () => {
        const empty_config = new WyvrFileConfig();
        it('undefined', () => {
            assert.deepStrictEqual(Client.parse_wyvr_config(), null);
        });
        it('null', () => {
            assert.deepStrictEqual(Client.parse_wyvr_config(null), null);
        });
        it('empty', () => {
            assert.deepStrictEqual(Client.parse_wyvr_config(''), null);
        });
        it('no config', () => {
            assert.deepStrictEqual(
                Client.parse_wyvr_config(`{
                prop: {
                    loading: 'lazy
                }
            }`),
                null
            );
        });
        it('config found', () => {
            assert.deepStrictEqual(Client.parse_wyvr_config(`wyvr: {}`), empty_config);
        });
        it('config found, space', () => {
            assert.deepStrictEqual(Client.parse_wyvr_config(`wyvr: { }`), empty_config);
        });
        it('string single quote', () => {
            const string_config = new WyvrFileConfig();
            string_config.string = 'test';
            assert.deepStrictEqual(Client.parse_wyvr_config(`wyvr: { string: 'test'}`), string_config);
        });
        it('string double quote', () => {
            const string_config = new WyvrFileConfig();
            string_config.string = 'test';
            assert.deepStrictEqual(Client.parse_wyvr_config(`wyvr: { string: "test"}`), string_config);
        });
        it('bool', () => {
            const bool_config = new WyvrFileConfig();
            bool_config.bool = true;
            assert.deepStrictEqual(Client.parse_wyvr_config(`wyvr: { bool: true}`), bool_config);
        });
        it('number float', () => {
            const number_config = new WyvrFileConfig();
            number_config.number = 10.5;
            assert.deepStrictEqual(Client.parse_wyvr_config(`wyvr: { number: 10.5 }`), number_config);
        });
        it('number int', () => {
            const number_config = new WyvrFileConfig();
            number_config.int = 10;
            assert.deepStrictEqual(Client.parse_wyvr_config(`wyvr: { int: 10 }`), number_config);
        });
        it('number invalid', () => {
            const number_config = new WyvrFileConfig();
            number_config.number = 1;
            assert.deepStrictEqual(Client.parse_wyvr_config(`wyvr: { number: 1..5 }`), number_config);
        });
    });
    describe('transform_hydrateable_svelte_files', () => {
        // it('', ()=>{})
    });
    describe('extract_tags_from_content', () => {
        it('undefined', () => {
            assert.deepStrictEqual(Client.extract_tags_from_content(), { content: '', result: [] });
        });
        it('null', () => {
            assert.deepStrictEqual(Client.extract_tags_from_content(null), { content: '', result: [] });
        });
        it('empty', () => {
            assert.deepStrictEqual(Client.extract_tags_from_content(''), { content: '', result: [] });
        });
        it('content but undefined tag', () => {
            assert.deepStrictEqual(Client.extract_tags_from_content('<a></a>'), { content: '<a></a>', result: [] });
        });
        it('content but null tag', () => {
            assert.deepStrictEqual(Client.extract_tags_from_content('<a></a>', null), { content: '<a></a>', result: [] });
        });
        it('content but empty tag', () => {
            assert.deepStrictEqual(Client.extract_tags_from_content('<a></a>', ''), { content: '<a></a>', result: [] });
        });
        it('content & tag', () => {
            assert.deepStrictEqual(Client.extract_tags_from_content('before <a>test</a> after', 'a'), { content: 'before  after', result: ['<a>test</a>'] });
        });
        it('content & tag with attributes', () => {
            assert.deepStrictEqual(Client.extract_tags_from_content('before <a href="#" download>test</a> after', 'a'), {
                content: 'before  after',
                result: ['<a href="#" download>test</a>'],
            });
        });
        it('content & multiple tags', () => {
            assert.deepStrictEqual(Client.extract_tags_from_content('before <a>test1</a> <a>test2</a> after', 'a'), {
                content: 'before   after',
                result: ['<a>test1</a>', '<a>test2</a>'],
            });
        });
        it('content & multiple tags with attributes', () => {
            assert.deepStrictEqual(
                Client.extract_tags_from_content('before <a href="#1" download>test1</a> <a href="#2" rel="noopener">test2</a> after', 'a'),
                { content: 'before   after', result: ['<a href="#1" download>test1</a>', '<a href="#2" rel="noopener">test2</a>'] }
            );
        });
    });
    describe('get_identifier_name', () => {
        const root_template_paths = [cwd + '/gen/src/doc', cwd + '/gen/src/layout', cwd + '/gen/src/page'];
        it('undefined', () => {
            assert.strictEqual(Client.get_identifier_name(), 'default');
        });
        it('null', () => {
            assert.strictEqual(Client.get_identifier_name(null), 'default');
        });
        it('empty', () => {
            assert.strictEqual(Client.get_identifier_name([]), 'default');
        });
        it('root, undefined', () => {
            assert.strictEqual(Client.get_identifier_name(root_template_paths), 'default');
        });
        it('root, null', () => {
            assert.strictEqual(Client.get_identifier_name(root_template_paths, null), 'default');
        });
        it('root, doc, undefined', () => {
            assert.strictEqual(Client.get_identifier_name(root_template_paths, cwd + '/gen/src/doc/Default.svelte'), 'default');
        });
        it('root, doc, null', () => {
            assert.strictEqual(Client.get_identifier_name(root_template_paths, cwd + '/gen/src/doc/Default.svelte', null), 'default');
        });
        it('root, doc, layout, undefined', () => {
            assert.strictEqual(
                Client.get_identifier_name(root_template_paths, cwd + '/gen/src/doc/Default.svelte', cwd + '/gen/src/layout/Default.svelte'),
                'default_default'
            );
        });
        it('root, doc, layout, null', () => {
            assert.strictEqual(
                Client.get_identifier_name(root_template_paths, cwd + '/gen/src/doc/Default.svelte', cwd + '/gen/src/layout/Default.svelte', null),
                'default_default'
            );
        });
        it('root, doc, layout, page', () => {
            assert.strictEqual(
                Client.get_identifier_name(
                    root_template_paths,
                    cwd + '/gen/src/doc/Default.svelte',
                    cwd + '/gen/src/layout/Default.svelte',
                    cwd + '/gen/src/page/Default.svelte',
                    null
                ),
                'default_default_default'
            );
        });
        it('complex identifier', () => {
            assert.strictEqual(
                Client.get_identifier_name(
                    root_template_paths,
                    cwd + '/gen/src/doc/DocTest/DocTest.svelte',
                    cwd + '/gen/src/layout/LayoutTest/LayoutTest.svelte',
                    cwd + '/gen/src/page/PageTest/PageTest.svelte',
                    null
                ),
                'doctest-doctest_layouttest-layouttest_pagetest-pagetest'
            );
        });
    });
    describe('replace_global', () => {
        // it('', ()=>{})
        const global = {
            nav: {
                header: [
                    {
                        url: 'https://wyvr.dev',
                    },
                ],
            },
        };
        it('undefined', () => {
            assert.deepStrictEqual(Client.replace_global(), '');
        });
        it('null', () => {
            assert.deepStrictEqual(Client.replace_global(null), '');
        });
        it('empty', () => {
            assert.deepStrictEqual(Client.replace_global(''), '');
        });
        it('valid, fallback null', () => {
            assert.strictEqual(Client.replace_global(`getGlobal('nav.header')`), 'null');
            assert.strictEqual(Client.replace_global(`getGlobal("nav.header")`), 'null');
        });
        it('valid index select, fallback null', () => {
            assert.strictEqual(Client.replace_global(`getGlobal('nav.header[0]')`), 'null');
        });
        it('valid, fallback array', () => {
            assert.strictEqual(Client.replace_global(`getGlobal('nav.header', [])`), '[]');
        });
        it('valid, fallback boolean', () => {
            assert.strictEqual(Client.replace_global(`getGlobal('nav.header', true)`), 'true');
        });
        it('valid, fallback string', () => {
            assert.strictEqual(Client.replace_global(`getGlobal('nav.header', 'test')`), '"test"');
        });
        it('valid without fallback', () => {
            assert.strictEqual(
                Client.replace_global(`getGlobal('nav.header')`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
            assert.strictEqual(
                Client.replace_global(`getGlobal("nav.header")`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
        });
        it('valid index select', () => {
            assert.strictEqual(
                Client.replace_global(`getGlobal('nav.header[0]')`, global),
                JSON.stringify({
                    url: 'https://wyvr.dev',
                })
            );
        });
        it('valid with fallback', () => {
            assert.strictEqual(
                Client.replace_global(`getGlobal('nav.header', [])`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
            assert.strictEqual(
                Client.replace_global(`getGlobal('nav.header', true)`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
            assert.strictEqual(
                Client.replace_global(`getGlobal('nav.header', 'test')`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
        });
    });
    describe('get_global', () => {
        const global = {
            nav: {
                header: [
                    {
                        url: 'https://wyvr.dev',
                    },
                ],
            },
            list: ['a', 'b'],
        };
        // it('', ()=>{})
        it('undefined', () => {
            assert.deepStrictEqual(Client.get_global(), null);
        });
        it('null', () => {
            assert.deepStrictEqual(Client.get_global(null), null);
        });
        it('empty', () => {
            assert.deepStrictEqual(Client.get_global(''), null);
        });
        it('fallback', () => {
            assert.deepStrictEqual(Client.get_global('', true), true);
        });
        it('list', () => {
            assert.deepStrictEqual(Client.get_global('list', true, global), ['a', 'b']);
        });
        it('first list entry', () => {
            assert.deepStrictEqual(Client.get_global('list[0]', true, global), 'a');
        });
        it('deep unknown', () => {
            assert.deepStrictEqual(Client.get_global('nav.footer', true, global), true);
        });
        it('deep search', () => {
            assert.deepStrictEqual(Client.get_global('nav.header[0]', null, global), {
                url: 'https://wyvr.dev',
            });
        });
        it('deep search property', () => {
            assert.deepStrictEqual(Client.get_global('nav.header[0].url', null, global), 'https://wyvr.dev');
        });
    });
    describe('extract_props_from_scripts', () => {
        it('undefined', () => {
            assert.deepStrictEqual(Client.extract_props_from_scripts(), []);
        });
        it('null', () => {
            assert.deepStrictEqual(Client.extract_props_from_scripts(null), []);
        });
        it('empty string', () => {
            assert.deepStrictEqual(Client.extract_props_from_scripts(''), []);
        });
        it('empty', () => {
            assert.deepStrictEqual(Client.extract_props_from_scripts(['']), []);
        });
        it('prop', () => {
            assert.deepStrictEqual(Client.extract_props_from_scripts(['export let name']), ['name']);
        });
        it('duplicated props', () => {
            assert.deepStrictEqual(
                Client.extract_props_from_scripts([
                    `
            export let name
            export let name
            `,
                ]),
                ['name']
            );
        });
        it('duplicated props in multiple scripts', () => {
            assert.deepStrictEqual(
                Client.extract_props_from_scripts([
                    'export let name',
                    `
            export let name
            export let name
            `,
                ]),
                ['name']
            );
        });
        it('props', () => {
            assert.deepStrictEqual(
                Client.extract_props_from_scripts([
                    'export let value',
                    `
            export let name
            export let prop
            `,
                ]),
                ['value', 'name', 'prop']
            );
        });
        it('no props', () => {
            assert.deepStrictEqual(
                Client.extract_props_from_scripts([
                    `
            export
            let name
            export const prop
            `,
                ]),
                []
            );
        });
    });
    describe('replace_slots', () => {
        it('undefined', () => {
            assert.strictEqual(Client.replace_slots(), '');
        });
        it('null', () => {
            assert.strictEqual(Client.replace_slots(null), '');
        });
        it('empty', () => {
            assert.strictEqual(Client.replace_slots(''), '');
        });
    });
    describe('replace_slots_static', () => {
        // it('', ()=>{})
        it('slot', () => {
            assert.strictEqual(Client.replace_slots_static('<slot></slot>'), '<span data-slot="default"><slot></slot></span>');
            assert.strictEqual(Client.replace_slots_static('<slot />'), '<span data-slot="default"><slot /></span>');
        });
        it('multiple slots', () => {
            assert.strictEqual(
                Client.replace_slots_static('<slot></slot><slot></slot>'),
                '<span data-slot="default"><slot></slot></span><span data-slot="default"><slot></slot></span>'
            );
            assert.strictEqual(
                Client.replace_slots_static('<slot /><slot />'),
                '<span data-slot="default"><slot /></span><span data-slot="default"><slot /></span>'
            );
        });
        it('slot with content', () => {
            assert.strictEqual(Client.replace_slots_static('<slot><img /></slot>'), '<span data-slot="default"><slot><img /></slot></span>');
        });
        it('multiple slots with content', () => {
            assert.strictEqual(
                Client.replace_slots_static('<slot><img /></slot><slot><img /></slot>'),
                '<span data-slot="default"><slot><img /></slot></span><span data-slot="default"><slot><img /></slot></span>'
            );
        });
        it('named slot', () => {
            assert.strictEqual(Client.replace_slots_static('<slot name="x"></slot>'), '<span data-slot="x"><slot name="x"></slot></span>');
        });
        it('named slot with content', () => {
            assert.strictEqual(Client.replace_slots_static('<slot name="x"><img /></slot>'), '<span data-slot="x"><slot name="x"><img /></slot></span>');
        });
    });
    describe('remove_on_server', () => {
        it('undefined', () => {
            assert.strictEqual(Client.remove_on_server(), '');
        });
        it('null', () => {
            assert.strictEqual(Client.remove_on_server(null), '');
        });
        it('empty', () => {
            assert.strictEqual(Client.remove_on_server(''), '');
        });
        it('lorem ipsum', () => {
            assert.strictEqual(Client.remove_on_server('lorem ipsum'), 'lorem ipsum');
        });
        it('empty onServer', () => {
            assert.strictEqual(Client.remove_on_server('onServer()'), '');
        });
        it('arrow onServer', () => {
            assert.strictEqual(Client.remove_on_server('onServer(() => {})'), '');
            assert.strictEqual(Client.remove_on_server('onServer((test) => { console.log(); })'), '');
        });
        it('function onServer', () => {
            assert.strictEqual(Client.remove_on_server('onServer(function() {})'), '');
            assert.strictEqual(Client.remove_on_server('onServer(function(test) { console.log(); })'), '');
            assert.strictEqual(Client.remove_on_server('onServer(function test() {})'), '');
            assert.strictEqual(Client.remove_on_server('onServer(function test(test) { console.log(); })'), '');
        });
        it('broken onServer', () => {
            assert.strictEqual(Client.remove_on_server('onServer('), 'onServer(');
        });
    });
    describe('replace_slots_client', () => {
        it('slot', () => {
            assert.strictEqual(Client.replace_slots_client('<slot></slot>'), '<div data-client-slot="default"><slot></slot></div>');
            assert.strictEqual(Client.replace_slots_client('<slot />'), '<div data-client-slot="default"><slot /></div>');
        });
        it('multiple slots', () => {
            assert.strictEqual(
                Client.replace_slots_client('<slot></slot><slot></slot>'),
                '<div data-client-slot="default"><slot></slot></div><div data-client-slot="default"><slot></slot></div>'
            );
            assert.strictEqual(
                Client.replace_slots_client('<slot /><slot />'),
                '<div data-client-slot="default"><slot /></div><div data-client-slot="default"><slot /></div>'
            );
        });
        it('slot with content', () => {
            assert.strictEqual(Client.replace_slots_client('<slot><img /></slot>'), '<div data-client-slot="default"><slot><img /></slot></div>');
        });
        it('multiple slots with content', () => {
            assert.strictEqual(
                Client.replace_slots_client('<slot><img /></slot><slot><img /></slot>'),
                '<div data-client-slot="default"><slot><img /></slot></div><div data-client-slot="default"><slot><img /></slot></div>'
            );
        });
        it('named slot', () => {
            assert.strictEqual(Client.replace_slots_client('<slot name="x"></slot>'), '<div data-client-slot="x"><slot name="x"></slot></div>');
        });
        it('named slot with content', () => {
            assert.strictEqual(Client.replace_slots_client('<slot name="x"><img /></slot>'), '<div data-client-slot="x"><slot name="x"><img /></slot></div>');
        });
    });
    describe('insert_splits', () => {
        it('file undefined', () => {
            assert.strictEqual(Client.insert_splits(), '');
        });
        it('file null', () => {
            assert.strictEqual(Client.insert_splits(null), '');
        });
        it('file empty', () => {
            assert.strictEqual(Client.insert_splits(''), '');
        });
        it('file, undefined', () => {
            assert.strictEqual(Client.insert_splits('test/lib/client/insert_splits/empty.svelte'), '');
        });
        it('file, null', () => {
            assert.strictEqual(Client.insert_splits('test/lib/client/insert_splits/empty.svelte', null), '');
        });
        it('file, empty', () => {
            assert.strictEqual(Client.insert_splits('test/lib/client/insert_splits/empty.svelte', ''), '');
        });
        it('non existing file', () => {
            assert.strictEqual(Client.insert_splits('test/lib/client/insert_splits/ghost.svelte', 'hello'), '');
        });
        it('merge css', () => {
            assert.strictEqual(
                Client.insert_splits(
                    'test/lib/client/insert_splits/css.svelte',
                    readFileSync('test/lib/client/insert_splits/css.svelte', { encoding: 'utf-8' })
                ),
                readFileSync('test/lib/client/insert_splits/css_result.svelte', { encoding: 'utf-8' })
            );
        });
        it('merge js', () => {
            assert.strictEqual(
                Client.insert_splits(
                    'test/lib/client/insert_splits/js.svelte',
                    readFileSync('test/lib/client/insert_splits/js.svelte', { encoding: 'utf-8' })
                ),
                readFileSync('test/lib/client/insert_splits/js_result.svelte', { encoding: 'utf-8' })
            );
        });
    });
    describe('css_hash', () => {
        it('undefined', () => {
            assert.strictEqual(Client.css_hash(), 'wyvr');
        });
        it('null', () => {
            assert.strictEqual(Client.css_hash(null), 'wyvr');
        });
        it('hash', () => {
            assert.strictEqual(
                Client.css_hash({
                    hash: (css) => {
                        return css;
                    },
                    css: 'a',
                    name: '',
                    filename: '',
                }),
                'wyvr-a'
            );
        });
    });
});
