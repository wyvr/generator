import { deepStrictEqual } from 'node:assert';
import { join } from 'node:path';
import Sinon from 'sinon';
import { parse_props } from '../../../src/utils/shortcode.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/shortcode/parse_props', () => {
    let log = [];
    const root = join(process.cwd(), 'test/utils/shortcode/_tests');
    before(() => {
        Cwd.set(root);
        Sinon.stub(console, 'log');
        console.log.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        Cwd.set(undefined);
        console.log.restore();
    });
    it('undefined', () => {
        deepStrictEqual(parse_props(), undefined);
        deepStrictEqual(log, []);
    });
    it('empty', () => {
        deepStrictEqual(parse_props('', 'file'), undefined);
        deepStrictEqual(log, []);
    });
    it('single prop', () => {
        deepStrictEqual(parse_props('a={1}', 'file'), { a: '1' });
        deepStrictEqual(log, []);
    });
    it('static props', () => {
        deepStrictEqual(parse_props('label="text"', 'file'), {
            label: '"text"',
        });
        deepStrictEqual(log, []);
    });
    it('multiple prop', () => {
        deepStrictEqual(parse_props('a={1} b={true} c={{key:true}}', 'file'), {
            a: '1',
            b: 'true',
            c: '{"key":true}',
        });
        deepStrictEqual(log, []);
    });
    it('static prop with &quot;', () => {
        deepStrictEqual(parse_props('a=&quot;a&quot;', 'file'), {
            a: '"a"',
        });
        deepStrictEqual(log, []);
    });
    it('single prop with &quot;', () => {
        deepStrictEqual(parse_props('b={&quot;b&quot;}', 'file'), {
            b: '"b"',
        });
        deepStrictEqual(log, []);
    });
    it('object props with &quot;', () => {
        deepStrictEqual(
            parse_props('c={{&quot;key&quot;:&quot;c&quot;}}', 'file'),
            {
                c: '{"key":"c"}',
            }
        );
        deepStrictEqual(log, []);
    });
    it('multiple props with &quot;', () => {
        deepStrictEqual(
            parse_props(
                'a=&quot;a&quot; b={&quot;b&quot;} c={{&quot;key&quot;:&quot;c&quot;}}',
                'file'
            ),
            {
                a: '"a"',
                b: '"b"',
                c: '{"key":"c"}',
            }
        );
        deepStrictEqual(log, []);
    });
    it('unfinished prop', () => {
        deepStrictEqual(parse_props('a={1', 'file'), undefined);
        deepStrictEqual(log, []);
    });
    it('broken prop', () => {
        deepStrictEqual(parse_props('a={["a","]}', 'file'), undefined);
        deepStrictEqual(log, [
            ['⚠', 'shortcode shortcode prop "a" can not be converted in file'],
        ]);
    });
    it('partial broken prop', () => {
        deepStrictEqual(parse_props('a={["a","]} b={true} c={1', 'file'), {
            b: 'true',
        });
        deepStrictEqual(log, [
            ['⚠', 'shortcode shortcode prop "a" can not be converted in file'],
        ]);
    });
});
