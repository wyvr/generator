import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WyvrFileConfig } from '../../../src/struc/wyvr_file.js';
import { extract_wyvr_file_config } from '../../../src/model/wyvr_file.js';
import { clone } from '../../../src/utils/json.js';

describe('model/wyvr_file/extract_wyvr_file_config', () => {
    it('undefined', () => {
        const result = clone(WyvrFileConfig);
        deepStrictEqual(extract_wyvr_file_config(), result);
    });
    it('nothing inside content', () => {
        const result = clone(WyvrFileConfig);
        deepStrictEqual(extract_wyvr_file_config('some content'), result);
    });
    it('empty config', () => {
        const result = clone(WyvrFileConfig);
        deepStrictEqual(extract_wyvr_file_config('<script>wyvr: {}</script>'), result);
    });
    it('not in script tags', () => {
        const result = clone(WyvrFileConfig);
        deepStrictEqual(
            extract_wyvr_file_config(`wyvr: {
            display: 'inline'
        }`),
            result
        );
    });
    it('override prop', () => {
        const result = clone(WyvrFileConfig);
        result.display = 'inline';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
            display: 'inline'
        }</script>`),
            result
        );
    });
    it('missing script start', () => {
        const result = clone(WyvrFileConfig);
        deepStrictEqual(
            extract_wyvr_file_config(`wyvr: {
            display: 'inline'
        }</script>`),
            result
        );
    });
    it('missing script end', () => {
        const result = clone(WyvrFileConfig);
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
            display: 'inline'
        }`),
            result
        );
    });
    it('out of balance script tags', () => {
        const result = clone(WyvrFileConfig);
        deepStrictEqual(
            extract_wyvr_file_config(`</script>wyvr: {
            display: 'inline'
        }<script>`),
            result
        );
    });
    it('without space', () => {
        const result = clone(WyvrFileConfig);
        result.display = 'inline';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr:{
            display:'inline'
        }</script>`),
            result
        );
    });
    it('add bool', () => {
        const result = clone(WyvrFileConfig);
        result.test = true;
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
            test:    true
        }</script>`),
            result
        );
    });
    it('add number', () => {
        const result = clone(WyvrFileConfig);
        result.test = 1.23;
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
            test:    1.23
        }</script>`),
            result
        );
    });
    it('auto encapsulate media', () => {
        const result = clone(WyvrFileConfig);
        result.media = '(min-width: 500px)';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
            media: 'min-width: 500px'
        }</script>`),
            result
        );
    });
    it('avoid auto encapsulate media', () => {
        const result = clone(WyvrFileConfig);
        result.media = 'min-width: 500px and screen';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
            media: 'min-width: 500px and screen'
        }</script>`),
            result
        );
    });

    it('extract condition', () => {
        const result = clone(WyvrFileConfig);
        result.condition = "\nreturn JSON.parse(localStorage.getItem('key') ?? 'false');";
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
                condition: () => {
                return JSON.parse(localStorage.getItem('key') ?? 'false');
            }
        }</script>`),
            result
        );
    });
});
