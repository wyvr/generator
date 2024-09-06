import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { WyvrFileConfig } from '../../../src/struc/wyvr_file.js';
import { extract_wyvr_file_config } from '../../../src/model/wyvr_file.js';

describe('model/wyvr_file/extract_wyvr_file_config', () => {
    it('undefined', () => {
        const result = structuredClone(WyvrFileConfig);
        deepStrictEqual(extract_wyvr_file_config(), result);
    });
    it('nothing inside content', () => {
        const result = structuredClone(WyvrFileConfig);
        deepStrictEqual(extract_wyvr_file_config('some content'), result);
    });
    it('empty config', () => {
        const result = structuredClone(WyvrFileConfig);
        deepStrictEqual(
            extract_wyvr_file_config('<script>wyvr: {}</script>'),
            result
        );
    });
    it('not in script tags', () => {
        const result = structuredClone(WyvrFileConfig);
        deepStrictEqual(
            extract_wyvr_file_config(`wyvr: {
            display: 'inline'
        }`),
            result
        );
    });
    it('override prop', () => {
        const result = structuredClone(WyvrFileConfig);
        result.display = 'inline';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
            display: 'inline'
        }</script>`),
            result
        );
    });
    it('missing script start', () => {
        const result = structuredClone(WyvrFileConfig);
        deepStrictEqual(
            extract_wyvr_file_config(`wyvr: {
            display: 'inline'
        }</script>`),
            result
        );
    });
    it('missing script end', () => {
        const result = structuredClone(WyvrFileConfig);
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
            display: 'inline'
        }`),
            result
        );
    });
    it('out of balance script tags', () => {
        const result = structuredClone(WyvrFileConfig);
        deepStrictEqual(
            extract_wyvr_file_config(`</script>wyvr: {
            display: 'inline'
        }<script>`),
            result
        );
    });
    it('without space', () => {
        const result = structuredClone(WyvrFileConfig);
        result.display = 'inline';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr:{
            display:'inline'
        }</script>`),
            result
        );
    });
    it('add bool', () => {
        const result = structuredClone(WyvrFileConfig);
        result.test = true;
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
            test:    true
        }</script>`),
            result
        );
    });
    it('add number', () => {
        const result = structuredClone(WyvrFileConfig);
        result.test = 1.23;
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
            test:    1.23
        }</script>`),
            result
        );
    });
    it('auto encapsulate media', () => {
        const result = structuredClone(WyvrFileConfig);
        result.media = '(min-width: 500px)';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
            media: 'min-width: 500px'
        }</script>`),
            result
        );
    });
    it('avoid auto encapsulate media', () => {
        const result = structuredClone(WyvrFileConfig);
        result.media = 'min-width: 500px and screen';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
            media: 'min-width: 500px and screen'
        }</script>`),
            result
        );
    });

    it('extract condition', () => {
        const result = structuredClone(WyvrFileConfig);
        result.condition =
            "\nreturn JSON.parse(localStorage.getItem('key') ?? 'false');";
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
                condition: () => {
                return JSON.parse(localStorage.getItem('key') ?? 'false');
            }
        }</script>`),
            result
        );
    });
    it('multiple', () => {
        const result = structuredClone(WyvrFileConfig);
        result.render = 'hydrate';
        result.loading = 'interact';
        result.trigger = 'found_product_tab_hash';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
        render: 'hydrate'
        loading: 'interact'
        trigger: 'found_product_tab_hash'
            }
        }</script>`),
            result
        );
    });
    it('with ; at the end', () => {
        const result = structuredClone(WyvrFileConfig);
        result.render = 'hydrate';
        result.loading = 'interact';
        result.trigger = 'trigger_name';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
        render: 'hydrate';
        loading: 'interact';
        trigger: 'trigger_name';
            }
        }</script>`),
            result
        );
    });
    it('loading none and trigger', () => {
        const result = structuredClone(WyvrFileConfig);
        result.render = 'hydrate';
        result.loading = 'none';
        result.trigger = 'trigger_name';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
                render: 'hydrate';
                loading: 'none';
                trigger: 'trigger_name';
            }</script>`),
            result
        );
    });
    it('alias hydrate|request', () => {
        const result = structuredClone(WyvrFileConfig);
        result.render = 'hydrequest';
        result.loading = 'instant';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
                render: 'hydrate|request';
                loading: 'instant';
            }</script>`),
            result
        );
    });
    it('alias request|hydrate', () => {
        const result = structuredClone(WyvrFileConfig);
        result.render = 'hydrequest';
        result.loading = 'instant';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>wyvr: {
                render: 'request|hydrate';
                loading: 'instant';
            }</script>`),
            result
        );
    });
    it('more content', () => {
        const result = structuredClone(WyvrFileConfig);
        result.render = 'hydrate';
        result.loading = 'none';
        result.trigger = 'trigger_name';
        deepStrictEqual(
            extract_wyvr_file_config(`<script>import Image from '$src/wyvr/Image.svelte';
            import { onMount } from 'svelte';
        
            export let brands;
        
            wyvr: {
                render: 'hydrate';
                loading: 'none';
                trigger: 'trigger_name';
            }
        
            let selected;
        
            $: allowed_brands = brands.filter((brand) => !brand.parent_brand && brand.is_active);
            $: filtered_brands = get_brands(allowed_brands, selected);
        
            onMount(() => {
                if (window.selected_brand) {
                    selected = window.selected_brand;
                }
            });</script>`),
            result
        );
    });
    describe('deprecated @src', () => {
        it('more content', () => {
            const result = structuredClone(WyvrFileConfig);
            result.render = 'hydrate';
            result.loading = 'none';
            result.trigger = 'trigger_name';
            deepStrictEqual(
                extract_wyvr_file_config(`<script>import Image from '@src/wyvr/Image.svelte';
                import { onMount } from 'svelte';
            
                export let brands;
            
                wyvr: {
                    render: 'hydrate';
                    loading: 'none';
                    trigger: 'trigger_name';
                }
            
                let selected;
            
                $: allowed_brands = brands.filter((brand) => !brand.parent_brand && brand.is_active);
                $: filtered_brands = get_brands(allowed_brands, selected);
            
                onMount(() => {
                    if (window.selected_brand) {
                        selected = window.selected_brand;
                    }
                });</script>`),
                result
            );
        });
    });
});
