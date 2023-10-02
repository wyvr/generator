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
        deepStrictEqual(extract_wyvr_file_config('wyvr: {}'), result);
    });
    it('override prop', () => {
        const result = clone(WyvrFileConfig);
        result.display = 'inline';
        deepStrictEqual(
            extract_wyvr_file_config(`wyvr: {
            display: 'inline'
        }`),
            result
        );
    });
    it('without space', () => {
        const result = clone(WyvrFileConfig);
        result.display = 'inline';
        deepStrictEqual(
            extract_wyvr_file_config(`wyvr:{
            display:'inline'
        }`),
            result
        );
    });
    it('add bool', () => {
        const result = clone(WyvrFileConfig);
        result.test = true;
        deepStrictEqual(
            extract_wyvr_file_config(`wyvr: {
            test:    true
        }`),
            result
        );
    });
    it('add number', () => {
        const result = clone(WyvrFileConfig);
        result.test = 1.23;
        deepStrictEqual(
            extract_wyvr_file_config(`wyvr: {
            test:    1.23
        }`),
            result
        );
    });
    it('auto encapsulate media', () => {
        const result = clone(WyvrFileConfig);
        result.media = '(min-width: 500px)';
        deepStrictEqual(
            extract_wyvr_file_config(`wyvr: {
            media: 'min-width: 500px'
        }`),
            result
        );
    });
    it('avoid auto encapsulate media', () => {
        const result = clone(WyvrFileConfig);
        result.media = 'min-width: 500px and screen';
        deepStrictEqual(
            extract_wyvr_file_config(`wyvr: {
            media: 'min-width: 500px and screen'
        }`),
            result
        );
    });
});
