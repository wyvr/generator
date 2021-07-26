require('module-alias/register');

describe('Lib/Global', () => {
    const assert = require('assert');
    const { Global } = require('@lib/global');

    beforeEach(() => {
        delete global.getGlobal;
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
            assert.deepStrictEqual(Global.replace_global(), '');
        });
        it('null', () => {
            assert.deepStrictEqual(Global.replace_global(null), '');
        });
        it('empty', () => {
            assert.deepStrictEqual(Global.replace_global(''), '');
        });
        it('nothing', () => {
            assert.deepStrictEqual(Global.replace_global('hello', global), 'hello');
        });
        it('valid, fallback null', () => {
            assert.strictEqual(Global.replace_global(`getGlobal('nav.header')`), 'null');
            assert.strictEqual(Global.replace_global(`getGlobal("nav.header")`), 'null');
        });
        it('valid index select, fallback null', () => {
            assert.strictEqual(Global.replace_global(`getGlobal('nav.header[0]')`), 'null');
        });
        it('valid, fallback array', () => {
            assert.strictEqual(Global.replace_global(`getGlobal('nav.header', [])`), '[]');
        });
        it('valid, fallback boolean', () => {
            assert.strictEqual(Global.replace_global(`getGlobal('nav.header', true)`), 'true');
        });
        it('valid, fallback string', () => {
            assert.strictEqual(Global.replace_global(`getGlobal('nav.header', 'test')`), '"test"');
        });
        it('valid without fallback', () => {
            assert.strictEqual(
                Global.replace_global(`getGlobal('nav.header')`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
            assert.strictEqual(
                Global.replace_global(`getGlobal("nav.header")`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
        });
        it('valid index select', () => {
            assert.strictEqual(
                Global.replace_global(`getGlobal('nav.header[0]')`, global),
                JSON.stringify({
                    url: 'https://wyvr.dev',
                })
            );
        });
        it('replace unknown key', () => {
            assert.strictEqual(Global.replace_global(`getGlobal('faker.text')`, global), 'null');
        });
        it('valid with fallback', () => {
            assert.strictEqual(
                Global.replace_global(`getGlobal('nav.header', [])`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
            assert.strictEqual(
                Global.replace_global(`getGlobal('nav.header', true)`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
            assert.strictEqual(
                Global.replace_global(`getGlobal('nav.header', 'test')`, global),
                JSON.stringify([
                    {
                        url: 'https://wyvr.dev',
                    },
                ])
            );
        });
        it('valid with fallback object', () => {
            assert.strictEqual(
                Global.replace_global(
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
        it('callback array', () => {
            assert.strictEqual(
                Global.replace_global(
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
        it('callback fallback array', () => {
            assert.strictEqual(
                Global.replace_global(
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
        it('callback object', () => {
            assert.strictEqual(
                Global.replace_global(
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
        it('callback fallback object', () => {
            assert.strictEqual(
                Global.replace_global(
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
        it('add around code', () => {
            assert.strictEqual(
                Global.replace_global(
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
        it('avoid replacing because it has no params', () => {
            assert.deepStrictEqual(Global.replace_global('_getGlobal()', global), '_getGlobal()');
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
            assert.deepStrictEqual(Global.get_global(), null);
        });
        it('null', () => {
            assert.deepStrictEqual(Global.get_global(null), null);
        });
        it('empty', () => {
            assert.deepStrictEqual(Global.get_global(''), null);
        });
        it('fallback', () => {
            assert.deepStrictEqual(Global.get_global('', true), true);
        });
        it('list', () => {
            assert.deepStrictEqual(Global.get_global('list', true, global), ['a', 'b']);
        });
        it('list on null', () => {
            assert.deepStrictEqual(Global.get_global('list', true, null), true);
        });
        it('first list entry', () => {
            assert.strictEqual(Global.get_global('list[0]', true, global), 'a');
        });
        it('first list entry on null', () => {
            assert.strictEqual(Global.get_global('list[0]', true, null), true);
        });
        it('deep unknown', () => {
            assert.strictEqual(Global.get_global('nav.footer', true, global), true);
        });
        it('deep unknown on null', () => {
            assert.strictEqual(Global.get_global('nav.footer', true, null), true);
        });
        it('deep search', () => {
            assert.deepStrictEqual(Global.get_global('nav.header[0]', null, global), {
                url: 'https://wyvr.dev',
            });
        });
        it('deep search on null', () => {
            assert.strictEqual(Global.get_global('nav.header[0]', true, null), true);
        });
        it('deep search unknown on null', () => {
            assert.strictEqual(Global.get_global('nav.header[]', true, global), true);
        });
        it('deep search property', () => {
            assert.strictEqual(Global.get_global('nav.header[0].url', null, global), 'https://wyvr.dev');
        });
        it('deep search property on null', () => {
            assert.strictEqual(Global.get_global('nav.header[0].url', true, null), true);
        });
        it('deep unknown search property', () => {
            assert.strictEqual(Global.get_global('nonexisting.this.is.an.test', true, null), true);
        });
        it('deep unknown search property', () => {
            console.log();
            assert.strictEqual(Global.get_global('nonexisting.this.is.an.test', undefined, null), null);
        });
        it('nav error', () => {
            const log = console.log;
            const output = [];
            console.log = (...messages) => {
                output.push(messages);
            };
            assert.strictEqual(Global.get_global('nav', null, true), null);
            assert.deepStrictEqual(output, [
                [
                    '\u001b[31m✘\u001b[39m',
                    '\u001b[31m[wyvr]\u001b[39m \u001b[31mavoid getting getGlobal("nav") because of potential memory leak, add a callback to shrink results\u001b[39m',
                ],
            ]);
            console.log = log;
        });
        it('nav error workaround not contained', () => {
            const log = console.log;
            const output = [];
            console.log = (...messages) => {
                output.push(messages);
            };
            assert.strictEqual(
                Global.get_global('nav', null, true, (data) => {
                    return false;
                }),
                null
            );
            assert.deepStrictEqual(output, []);
            console.log = log;
        });
        it('nav error workaround', () => {
            const log = console.log;
            const output = [];
            console.log = (...messages) => {
                output.push(messages);
            };
            assert.strictEqual(
                Global.get_global('nav', null, {nav: []}, (data) => {
                    return false;
                }),
                false
            );
            assert.deepStrictEqual(output, []);
            console.log = log;
        });
    });
    describe('apply_callback', () => {
        it('no callback', () => {
            assert.deepStrictEqual(Global.apply_callback(true), true);
        });
        it('callback', () => {
            assert.deepStrictEqual(
                Global.apply_callback(true, () => {
                    return false;
                }),
                false
            );
        });
        it('error', () => {
            assert.deepStrictEqual(
                Global.apply_callback(true, () => {
                    return a;
                }),
                true
            );
        });
    });
});
