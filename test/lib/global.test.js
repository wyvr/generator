const { removeSync } = require('fs-extra');

require('module-alias/register');

describe('Lib/Global', async () => {
    const assert = require('assert');
    const { Global } = require('@lib/global');

    beforeEach(() => {
        delete global.getGlobal;
    });
    after(()=>{
        removeSync('cache/global.db')
    })
    describe('replace_global', async () => {
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
        it('undefined', async () => {
            assert.deepStrictEqual(await Global.replace_global(), '');
        });
        it('null', async () => {
            assert.deepStrictEqual(await Global.replace_global(null), '');
        });
        it('empty', async () => {
            assert.deepStrictEqual(await Global.replace_global(''), '');
        });
        it('nothing', async () => {
            assert.deepStrictEqual(await Global.replace_global('hello', global), 'hello');
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
        it('valid without fallback', async () => {
            assert.strictEqual(
                await Global.replace_global(`getGlobal('nav.header')`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
            assert.strictEqual(
                await Global.replace_global(`getGlobal("nav.header")`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
        });
        it('valid index select', async () => {
            assert.strictEqual(
                await Global.replace_global(`getGlobal('nav.header[0]')`, global),
                JSON.stringify({
                    url: 'https://wyvr.dev',
                })
            );
        });
        it('replace unknown key', async () => {
            assert.strictEqual(await Global.replace_global(`getGlobal('faker.text')`, global), 'null');
        });
        it('valid with fallback', async () => {
            assert.strictEqual(
                await Global.replace_global(`getGlobal('nav.header', [])`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
            assert.strictEqual(
                await Global.replace_global(`getGlobal('nav.header', true)`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
            assert.strictEqual(
                await Global.replace_global(`getGlobal('nav.header', 'test')`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
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
        it('callback array', async () => {
            assert.strictEqual(
                await Global.replace_global(
                    `getGlobal('nav.header', [], (data) => {
                    return data.filter((item)=>{
                        return item && item.url && item.url.indexOf('match') > -1;
                    })
                })`,
                    {
                        nav: {
                            header: [{ url: 'match' }, { url: 'nope' }, { url: 'not' }],
                        },
                    }
                ),
                JSON.stringify([
                    {
                        url: 'match',
                    },
                ])
            );
        });
        it('callback fallback array', async () => {
            assert.strictEqual(
                await Global.replace_global(
                    `getGlobal('nav.header', [{ url: 'match' }, { url: 'nope' }, { url: 'not' }], (data) => {
                    return data.filter((item)=>{
                        return item && item.url && item.url.indexOf('match') > -1;
                    })
                })`,
                    null
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
                    })`,
                    {
                        item: {
                            a: true,
                            b: false,
                        },
                    }
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
                    })`,
                    null
                ),
                JSON.stringify({
                    a: true,
                    b: false,
                    c: true,
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
        it('avoid replacing because it has no params', async () => {
            assert.deepStrictEqual(await Global.replace_global('_getGlobal()', global), '_getGlobal()');
        });
    });
    describe('get_global', async () => {
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
            assert.deepStrictEqual(await Global.get_global('list', true, global), ['a', 'b']);
        });
        it('list on null', async () => {
            assert.deepStrictEqual(await Global.get_global('list', true, null), true);
        });
        it('first list entry', async () => {
            assert.strictEqual(await Global.get_global('list[0]', true, global), 'a');
        });
        it('first list entry on null', async () => {
            assert.strictEqual(await Global.get_global('list[0]', true, null), true);
        });
        it('deep unknown', async () => {
            assert.strictEqual(await Global.get_global('nav.footer', true, global), true);
        });
        it('deep unknown on null', async () => {
            assert.strictEqual(await Global.get_global('nav.footer', true, null), true);
        });
        it('deep search', async () => {
            assert.deepStrictEqual(await Global.get_global('nav.header[0]', null, global), {
                url: 'https://wyvr.dev',
            });
        });
        it('deep search on null', async () => {
            assert.strictEqual(await Global.get_global('nav.header[0]', true, null), true);
        });
        it('deep search unknown on null', async () => {
            assert.strictEqual(await Global.get_global('nav.header[]', true, global), true);
        });
        it('deep search property', async () => {
            assert.strictEqual(await Global.get_global('nav.header[0].url', null, global), 'https://wyvr.dev');
        });
        it('deep search property on null', async () => {
            assert.strictEqual(await Global.get_global('nav.header[0].url', true, null), true);
        });
        it('deep unknown search property', async () => {
            assert.strictEqual(await Global.get_global('nonexisting.this.is.an.test', true, null), true);
        });
        it('deep unknown search property', async () => {
            console.log();
            assert.strictEqual(await Global.get_global('nonexisting.this.is.an.test', undefined, null), null);
        });
        it('nav error', async () => {
            const log = console.log;
            const output = [];
            console.log = (...messages) => {
                output.push(messages);
            };
            assert.strictEqual(await Global.get_global('nav', null, true), null);
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
                await Global.get_global('nav', null, true, (data) => {
                    return false;
                }),
                null
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
                await Global.get_global('nav', null, {nav: []}, (data) => {
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
        // it('', async () => {
        // });
    });
    describe('set_global', async () => {
        it('empty', async () => {
            assert.strictEqual(await Global.set_global(), false)
        });
    });
});
