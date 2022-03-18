require('module-alias/register');

describe('Lib/Logger', () => {
    const assert = require('assert');
    process.env.WYVR_ENV = 'debug';
    const { Logger } = require('@lib/logger');
    const color = require('ansi-colors');
    // mock console.log
    let log = null;
    let result = [];
    before(() => {
        // runs once before the first test in this block
        log = console.log;
        console.log = (...args) => {
            result.push(args);
        };
    });
    afterEach(() => {
        result = [];
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
    });

    describe('set_env', () => {
        it('empty', () => {
            Logger.set_env();
            assert.strictEqual(Logger.env, 'development');
        });
        it('debug', () => {
            assert.strictEqual(Logger.env, 'development');
            Logger.set_env('debug');
            assert.strictEqual(Logger.env, 'debug');
            Logger.set_env('development');
        });
        it('production', () => {
            assert.strictEqual(Logger.env, 'development');
            Logger.set_env('production');
            assert.strictEqual(Logger.env, 'production');
            Logger.set_env('development');
        });
    });
    describe('stringify', () => {
        it('empty', () => {
            assert.strictEqual(Logger.stringify(), undefined);
        });
        it('undefined', () => {
            assert.strictEqual(Logger.stringify(undefined), undefined);
        });
        it('null', () => {
            assert.strictEqual(Logger.stringify(null), 'null');
        });
        it('string', () => {
            assert.strictEqual(Logger.stringify('a'), 'a');
        });
        it('number', () => {
            assert.strictEqual(Logger.stringify(1), '1');
        });
        it('string array', () => {
            assert.strictEqual(Logger.stringify(['a']), '["a"]');
        });
        it('object', () => {
            assert.strictEqual(Logger.stringify({ a: 'a' }), '{"a":"a"}');
        });
        it('object array', () => {
            assert.strictEqual(Logger.stringify([{ a: 'a' }]), '[{"a":"a"}]');
        });
    });
    describe('output', () => {
        it('empty', () => {
            Logger.output();
            assert.deepStrictEqual(result, [[undefined, '']]);
        });
        it('null', () => {
            Logger.output(null);
            assert.deepStrictEqual(result, [[undefined, '']]);
        });
        it('symbol', () => {
            Logger.output(null, null, '#');
            assert.deepStrictEqual(result, [['#', '']]);
        });
        it('symbol + text', () => {
            Logger.output(null, null, '#', 'a');
            assert.deepStrictEqual(result, [['#', 'a']]);
        });
        it('symbol + multiple text', () => {
            Logger.output(null, null, '#', 'a', 'b');
            assert.deepStrictEqual(result, [['#', 'a b']]);
        });
        it('no symbol + text', () => {
            Logger.output(null, null, 'a');
            assert.deepStrictEqual(result, [['a', '']]);
        });
        it('no symbol + multiple text', () => {
            Logger.output(null, null, 'a', 'b');
            assert.deepStrictEqual(result, [['a', 'b']]);
        });
    });
    describe('log', () => {
        it('empty', () => {
            Logger.log();
            assert.deepStrictEqual(result, [['', '']]);
        });
        it('single', () => {
            Logger.log('a');
            assert.deepStrictEqual(result, [['', 'a']]);
        });
        it('multiple', () => {
            Logger.log('a', 'b', 'c', 'd');
            assert.deepStrictEqual(result, [['', 'a b c d']]);
        });
    });
    describe('present', () => {
        it('empty', () => {
            Logger.present();
            assert.deepStrictEqual(result, [[color.dim('-'), '']]);
        });
        it('single', () => {
            Logger.present('a');
            assert.deepStrictEqual(result, [[color.dim('-'), 'a']]);
        });
        it('multiple', () => {
            Logger.present('a', 'b', 'c', 'd');
            assert.deepStrictEqual(result, [[color.dim('-'), `a ${color.green('b')} c d`]]);
        });
    });
    describe('info', () => {
        it('empty', () => {
            Logger.info();
            assert.deepStrictEqual(result, [[color.cyan('i'), '']]);
        });
        it('single', () => {
            Logger.info('a');
            assert.deepStrictEqual(result, [[color.cyan('i'), 'a']]);
        });
        it('multiple', () => {
            Logger.info('a', 'b', 'c', 'd');
            assert.deepStrictEqual(result, [[color.cyan('i'), `a ${color.cyan('b')} c d`]]);
        });
    });
    describe('success', () => {
        it('empty', () => {
            Logger.success();
            assert.deepStrictEqual(result, [[color.green('✓'), '']]);
        });
        it('single', () => {
            Logger.success('a');
            assert.deepStrictEqual(result, [[color.green('✓'), 'a']]);
        });
        it('multiple', () => {
            Logger.success('a', 'b', 'c', 'd');
            assert.deepStrictEqual(result, [[color.green('✓'), `a ${color.green('b')} c d`]]);
        });
    });
    describe('warning', () => {
        it('empty', () => {
            Logger.warning();
            assert.deepStrictEqual(result, [[color.yellow('⚠'), '']]);
        });
        it('single', () => {
            Logger.warning('a');
            assert.deepStrictEqual(result, [[color.yellow('⚠'), color.yellow('a')]]);
        });
        it('multiple', () => {
            Logger.warning('a', 'b', 'c', 'd');
            assert.deepStrictEqual(result, [
                [
                    color.yellow('⚠'),
                    'a b c d'
                        .split(' ')
                        .map((x) => color.yellow(x))
                        .join(' '),
                ],
            ]);
        });
    });
    describe('error', () => {
        it('empty', () => {
            Logger.error();
            assert.deepStrictEqual(result, [[color.red('✘'), '']]);
        });
        it('single', () => {
            Logger.error('a');
            assert.deepStrictEqual(result, [[color.red('✘'), color.red('a')]]);
        });
        it('multiple', () => {
            Logger.error('a', 'b', 'c', 'd');
            assert.deepStrictEqual(result, [
                [
                    color.red('✘'),
                    'a b c d'
                        .split(' ')
                        .map((x) => color.red(x))
                        .join(' '),
                ],
            ]);
        });
    });
    describe('improve', () => {
        it('empty', () => {
            Logger.improve();
            assert.deepStrictEqual(result, [[color.magenta('⚡️'), '']]);
        });
        it('single', () => {
            Logger.improve('a');
            assert.deepStrictEqual(result, [[color.magenta('⚡️'), color.magenta('a')]]);
        });
        it('multiple', () => {
            Logger.improve('a', 'b', 'c', 'd');
            assert.deepStrictEqual(result, [
                [
                    color.magenta('⚡️'),
                    'a b c d'
                        .split(' ')
                        .map((x) => color.magenta(x))
                        .join(' '),
                ],
            ]);
        });
    });
    describe('debug', () => {
        it('empty', () => {
            Logger.set_env('debug');
            Logger.debug();
            Logger.set_env('development');
            assert.deepStrictEqual(result, [[color.dim('~'), '']]);
        });
        it('single', () => {
            Logger.set_env('debug');
            Logger.debug('a');
            Logger.set_env('development');
            assert.deepStrictEqual(result, [[color.dim('~'), color.dim('a')]]);
        });
        it('multiple', () => {
            Logger.set_env('debug');
            Logger.debug('a', 'b', 'c', 'd');
            Logger.set_env('development');
            assert.deepStrictEqual(result, [
                [
                    color.dim('~'),
                    'a b c d'
                        .split(' ')
                        .map((x) => color.dim(x))
                        .join(' '),
                ],
            ]);
        });
        it('disabled empty', () => {
            Logger.debug();
            assert.deepStrictEqual(result, []);
        });
        it('disabled single', () => {
            Logger.debug('a');
            assert.deepStrictEqual(result, []);
        });
        it('disabled multiple', () => {
            Logger.debug('a', 'b', 'c', 'd');
            assert.deepStrictEqual(result, []);
        });
    });
    describe('start/text/stop', () => {
        let spinner_text = '';
        const spinner = {};
        spinner.start = (name) => {
            return {
                spinner: '',
                text: name,
            };
        };
        spinner.succeed = (message) => {
            spinner_text = message;
        };
        spinner.stopAndPersist = (data) => {
            result.push(data);
            return spinner;
        };
        const create_spinner = Logger.create_spinner;

        beforeEach(() => {
            Logger.create_spinner = (name) => {
                spinner.text = name;
                return spinner;
            };
            Logger.spinner = spinner;
        });
        afterEach(() => {
            Logger.create_spinner = create_spinner;
        });
        it('text before start', () => {
            Logger.text('b');
            assert.deepStrictEqual(Logger.spinner.text, 'b');
        });
        it('start', () => {
            Logger.start('a');
            assert.deepStrictEqual(Logger.spinner.text, 'a');
        });
        it('text', () => {
            Logger.start('a');
            assert.deepStrictEqual(Logger.spinner.text, 'a');
            Logger.text('b');
            assert.deepStrictEqual(Logger.spinner.text, 'b');
        });
        it('stop', () => {
            Logger.start('a');
            assert.deepStrictEqual(Logger.spinner.text, 'a');
            Logger.text('b');
            assert.deepStrictEqual(Logger.spinner.text, 'b');
            Logger.stop('a');
            assert.deepStrictEqual(Logger.spinner, null);
        });
    });
    describe('production start/text/stop', () => {
        it('spinner', () => {
            Logger.set_env('production');
            Logger.start('a');
            assert.deepStrictEqual(Logger.spinner, null);
            Logger.text('b');
            assert.deepStrictEqual(Logger.spinner, null);
            Logger.stop('a');
            assert.deepStrictEqual(result, [
                ['', 'null \x1B[32m✓\x1B[39m \x1B[32ma\x1B[39m \x1B[2m.................................\x1B[22m 0 \x1B[2mms\x1B[22m'],
            ]);
            assert.deepStrictEqual(Logger.spinner, null);
            Logger.set_env('development');
        });
    });
    it('logo', () => {
        Logger.logo();
        assert.deepStrictEqual(result, [
            [
                '\x1B[36m__  __  __  __  __  ____\x1B[39m\n' +
                    '\x1B[36m\\ \\/ /\\/ /\\/ /\\/ /\\/ /_/\x1B[39m\n' +
                    '\x1B[36m \\/_/\\/_/\\/ /\\/_/\\/_/\x1B[39m\n' +
                    '\x1B[36m         /_/ generator \u001b[2m0.0.0\u001b[22m\u001b[39m',
            ],
            [''],
        ]);
    });
});
