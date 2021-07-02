require('module-alias/register');

describe('Lib/Client', () => {
    const assert = require('assert');
    const { Client } = require('@lib/client');

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
        // it('', ()=>{})
    });
    describe('transform_hydrateable_svelte_files', () => {
        // it('', ()=>{})
    });
    describe('extract_tags_from_content', () => {
        // it('', ()=>{})
    });
    describe('get_identifier_name', () => {
        // it('', ()=>{})
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
        // it('', ()=>{})
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
