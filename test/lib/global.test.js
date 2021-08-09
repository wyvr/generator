const { removeSync, existsSync } = require('fs-extra');
const { join } = require('path');

require('module-alias/register');

describe('Lib/Global', async () => {
    const assert = require('assert');
    const { Global } = require('@lib/global');

    async function setGlobalDB() {
        await Global.set_global('nav', {
            header: [
                {
                    url: 'https://wyvr.dev',
                },
            ],
        });
        await Global.set_global('list', ['a', 'b']);
        await Global.set_global('match', { header: [{ url: 'match' }, { url: 'nope' }, { url: 'not' }] });
        await Global.set_global('item', {
            a: true,
            b: false,
        });
    }
    function removeGlobalDB() {
        removeSync('cache/global.db');
        Global.db = null;
    }

    beforeEach(() => {
        delete global.getGlobal;
    });
    describe('replace_global without db', async () => {
        it('undefined', async () => {
            assert.deepStrictEqual(await Global.replace_global(), '');
        });
        it('null', async () => {
            assert.deepStrictEqual(await Global.replace_global(null), '');
        });
        it('empty', async () => {
            assert.deepStrictEqual(await Global.replace_global(''), '');
        });
        it('valid, fallback null', async () => {
            assert.strictEqual(await Global.replace_global(`getGlobal('nav.header')`), 'null');
            assert.strictEqual(await Global.replace_global(`getGlobal("nav.header")`), 'null');
        });
        it('valid index select, fallback null', async () => {
            assert.strictEqual(await Global.replace_global(`getGlobal('nav.header[0]')`), 'null');
        });
        it('valid, fallback array', async () => {
            assert.strictEqual(await Global.replace_global(`getGlobal('nav.header', [])`), '[]');
        });
        it('valid, fallback boolean', async () => {
            assert.strictEqual(await Global.replace_global(`getGlobal('nav.header', true)`), 'true');
        });
        it('valid, fallback string', async () => {
            assert.strictEqual(await Global.replace_global(`getGlobal('nav.header', 'test')`), '"test"');
        });
        it('valid with fallback object', async () => {
            assert.strictEqual(
                await Global.replace_global(
                    `getGlobal('demo', { 
                    'url': 'https://wyvr.dev'
                })`,
                    null
                ),
                JSON.stringify({
                    url: 'https://wyvr.dev',
                })
            );
        });
        it('add around code', async () => {
            assert.strictEqual(
                await Global.replace_global(
                    `const a = getGlobal('item', [1], (data) => {
                        data.push(0);
                        data.push(2);
                        return data;
                    }); a.filter((x)=>x)`,
                    []
                ),
                `const a = ${JSON.stringify([1, 0, 2])}; a.filter((x)=>x)`
            );
        });
        it('callback fallback array', async () => {
            assert.strictEqual(
                await Global.replace_global(
                    `getGlobal('match.header', [{ url: 'match' }, { url: 'nope' }, { url: 'not' }], (data) => {
                    return data.filter((item)=>{
                        return item && item.url && item.url.indexOf('match') > -1;
                    })
                })`
                ),
                JSON.stringify([
                    {
                        url: 'match',
                    },
                ])
            );
        });
    });
    describe('replace_global', async () => {
        before(async () => {
            await setGlobalDB();
        });
        after(() => {
            removeGlobalDB();
        });
        it('nothing', async () => {
            assert.deepStrictEqual(await Global.replace_global('hello'), 'hello');
        });

        it('valid without fallback', async () => {
            assert.strictEqual(
                await Global.replace_global(`getGlobal('nav.header')`),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
            assert.strictEqual(
                await Global.replace_global(`getGlobal("nav.header")`),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
        });
        it('valid index select', async () => {
            assert.strictEqual(
                await Global.replace_global(`getGlobal('nav.header[0]')`),
                JSON.stringify({
                    url: 'https://wyvr.dev',
                })
            );
        });
        it('replace unknown key', async () => {
            assert.strictEqual(await Global.replace_global(`getGlobal('faker.text')`), 'null');
        });
        it('valid with fallback', async () => {
            assert.strictEqual(
                await Global.replace_global(`getGlobal('nav.header', [])`),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
            assert.strictEqual(
                await Global.replace_global(`getGlobal('nav.header', true)`),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
            assert.strictEqual(
                await Global.replace_global(`getGlobal('nav.header', 'test')`),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
        });
        it('avoid replacing because it has no params', async () => {
            assert.deepStrictEqual(await Global.replace_global('_getGlobal()'), '_getGlobal()');
        });
        it('callback array', async () => {
            assert.strictEqual(
                await Global.replace_global(
                    `getGlobal('match.header', [], (data) => {
                    return data.filter((item)=>{
                        return item && item.url && item.url.indexOf('match') > -1;
                    })
                })`
                ),
                JSON.stringify([
                    {
                        url: 'match',
                    },
                ])
            );
        });

        it('callback object', async () => {
            assert.strictEqual(
                await Global.replace_global(
                    `getGlobal('item', false, (data) => {
                        data.c = true;
                        return data
                    })`
                ),
                JSON.stringify({
                    a: true,
                    b: false,
                    c: true,
                })
            );
        });
        it('callback fallback object', async () => {
            assert.strictEqual(
                await Global.replace_global(
                    `getGlobal('item', {
                        "a": true,
                        "b": false,
                    }, (data) => {
                        data.c = true;
                        return data
                    })`
                ),
                JSON.stringify({
                    a: true,
                    b: false,
                    c: true,
                })
            );
        });
    });
    describe('get_global without db', async () => {
        it('undefined', async () => {
            assert.deepStrictEqual(await Global.get_global(), null);
        });
        it('null', async () => {
            assert.deepStrictEqual(await Global.get_global(null), null);
        });
        it('empty', async () => {
            assert.deepStrictEqual(await Global.get_global(''), null);
        });
        it('fallback', async () => {
            assert.deepStrictEqual(await Global.get_global('', true), true);
        });
        it('list', async () => {
            assert.deepStrictEqual(await Global.get_global('list', true), true);
        });
        it('first list entry', async () => {
            assert.strictEqual(await Global.get_global('list[0]', true, null), true);
        });
        it('deep unknown on null', async () => {
            assert.strictEqual(await Global.get_global('nav.footer', true, null), true);
        });
        it('deep search on null', async () => {
            assert.strictEqual(await Global.get_global('nav.header[0]', true, null), true);
        });
        it('deep search property on null', async () => {
            assert.strictEqual(await Global.get_global('nav.header[0].url', true, null), true);
        });
        it('deep unknown search property', async () => {
            assert.strictEqual(await Global.get_global('nonexisting.this.is.an.test', true, null), true);
        });
        it('deep unknown search property', async () => {
            assert.strictEqual(await Global.get_global('nonexisting.this.is.an.test', undefined, null), null);
        });
    });
    describe('get_global', async () => {
        before(async () => {
            await setGlobalDB();
        });
        after(() => {
            removeGlobalDB();
        });
        it('list', async () => {
            assert.deepStrictEqual(await Global.get_global('list', true), ['a', 'b']);
        });

        it('first list entry', async () => {
            assert.strictEqual(await Global.get_global('list[0]', true), 'a');
        });
        it('unknown index', async () => {
            assert.strictEqual(await Global.get_global('unknown[0]', true), true);
        });

        it('deep unknown', async () => {
            assert.strictEqual(await Global.get_global('nav.footer', true), true);
        });
        it('deep search', async () => {
            assert.deepStrictEqual(await Global.get_global('nav.header[0]', null), {
                url: 'https://wyvr.dev',
            });
        });
        it('deep search unknown on null', async () => {
            assert.strictEqual(await Global.get_global('nav.header[]', true), true);
        });
        it('deep search property', async () => {
            assert.strictEqual(await Global.get_global('nav.header[0].url', null), 'https://wyvr.dev');
        });
    });
    describe('get_global nav', async () => {
        before(async () => {
            await setGlobalDB();
        });
        after(() => {
            removeGlobalDB();
        });
        it('nav error', async () => {
            const log = console.log;
            const output = [];
            console.log = (...messages) => {
                output.push(messages);
            };
            assert.strictEqual(await Global.get_global('nav', null), null);
            assert.deepStrictEqual(output, [
                [
                    '\u001b[31m✘\u001b[39m',
                    '\u001b[31m[wyvr]\u001b[39m \u001b[31mavoid getting getGlobal("nav") because of potential memory leak, add a callback to shrink results\u001b[39m',
                ],
            ]);
            console.log = log;
        });
        it('nav error workaround not contained', async () => {
            const log = console.log;
            const output = [];
            console.log = (...messages) => {
                output.push(messages);
            };
            assert.strictEqual(
                await Global.get_global('nav', null, (data) => {
                    return false;
                }),
                false
            );
            assert.deepStrictEqual(output, []);
            console.log = log;
        });
        it('nav error workaround', async () => {
            const log = console.log;
            const output = [];
            console.log = (...messages) => {
                output.push(messages);
            };
            assert.strictEqual(
                await Global.get_global('nav', null, (data) => {
                    return false;
                }),
                false
            );
            assert.deepStrictEqual(output, []);
            console.log = log;
        });
    });
    describe('apply_callback', async () => {
        it('no callback', async () => {
            assert.deepStrictEqual(await Global.apply_callback(true), true);
        });
        it('callback', async () => {
            assert.deepStrictEqual(
                await Global.apply_callback(true, async () => {
                    return false;
                }),
                false
            );
        });
        it('error', async () => {
            assert.deepStrictEqual(
                await Global.apply_callback(true, async () => {
                    return a;
                }),
                true
            );
        });
    });
    describe('setup', async () => {
        it('create', async () => {
            removeSync('cache');
            await Global.setup();
            assert.strictEqual(existsSync('cache/global.db'), true);
        });
    });
    describe('export', async () => {
        it('with filename', async () => {
            const path = join('test', 'lib', 'global');
            if (existsSync(path)) {
                removeSync(path);
            }
            const file = join(path, 'export.json');
            Global.export(file);
            assert(existsSync(file), true);
        });
    });
    describe('set_global', async () => {
        after(() => {
            removeGlobalDB();
        });
        it('empty', async () => {
            assert.strictEqual(await Global.set_global(), false);
        });
        it('no value', async () => {
            assert.strictEqual(await Global.set_global('key'), true);
        });
        it('save', async () => {
            assert.strictEqual(await Global.set_global('key', 'value'), true);
            assert.strictEqual(await Global.get_global('key'), 'value');
        });
        it('delete', async () => {
            await Global.set_global('key', 'value');
            assert.strictEqual(await Global.get_global('key'), 'value');
            assert.strictEqual(await Global.set_global('key'), true);
            assert.strictEqual(await Global.get_global('key'), null);
        });
    });
    describe('merge_global', async () => {
        before(async () => {
            await setGlobalDB();
        });
        after(() => {
            removeGlobalDB();
        });
        it('empty', async () => {
            assert.strictEqual(await Global.merge_global(), false);
        });
        it('no value', async () => {
            assert.strictEqual(await Global.merge_global('key'), false);
        });
        it('string', async () => {
            await Global.set_global('string', 'value');
            assert.strictEqual(await Global.merge_global('string', 'new'), true);
            assert.strictEqual(await Global.get_global('string'), 'new');
        });
        it('number', async () => {
            await Global.set_global('number', 0);
            assert.strictEqual(await Global.merge_global('number', 1), true);
            assert.strictEqual(await Global.get_global('number'), 1);
        });
        it('bool', async () => {
            await Global.set_global('bool', false);
            assert.strictEqual(await Global.merge_global('bool', true), true);
            assert.strictEqual(await Global.get_global('bool'), true);
        });
        it('array', async () => {
            await Global.set_global('array', [1, 2]);
            assert.strictEqual(await Global.merge_global('array', [3, 4]), true);
            assert.deepStrictEqual(await Global.get_global('array'), [1, 2, 3, 4]);
        });
        it('object', async () => {
            await Global.set_global('object', { key: false, value: 'old', arr: [0] });
            assert.strictEqual(await Global.merge_global('object', { key: true, arr: [1, 2], insert: true }), true);
            assert.deepStrictEqual(await Global.get_global('object'), { key: true, value: 'old', arr: [0, 1, 2], insert: true });
        });
    });
    describe('set_global_all', async () => {
        after(() => {
            removeGlobalDB();
        });
        it('save', async () => {
            await Global.set_global_all({ set_global_all: true });
            assert.strictEqual(await Global.get_global('set_global_all'), true);
        });
    });
});
