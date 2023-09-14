<script>
    /*
        import Image from '@src/wyvr/Image.svelte';

        <Image 
            src={imageSrc} 
            alt=''
            width={300} 
            height={200} 
            format={null} 
            quality={60} 
            sizes='(min-width: 1024px) 300px, 200px'
            widths={[300,200]}
            lazy={true} 
            css={'css-classes'}
        />
    */

    import { isClient, isServer } from '@wyvr/generator';
    import {
        get_image_src_data,
        get_image_src,
        get_image_src_shortcode,
        correct_image_format,
    } from '@src/wyvr/image_utils.js';
    export let src = null;
    export let width = 0;
    export let height = 0;
    export let alt = '';
    export let format = null;
    export let quality = 60;
    export let sizes = null;
    export let widths = null;
    export let css = null;
    export let style = null;
    export let lazy = true;
    export let mode = 'cover';
    export let fixed = false;

    function get_src(src, w, h, m, q, f, use_width) {
        const data = get_image_src_data(src, w, h, m, q, f, fixed, use_width, width);
        if (!data) {
            return '';
        }
        if (isServer) {
            return get_image_src_shortcode(data.src, data.config) + data.width_addition;
        }
        if (isClient) {
            return get_image_src(data.src, data.config) + data.width_addition;
        }
        return src;
    }

    $: cor_format = correct_image_format(format);
    $: cor_formats = ['webp'].filter((x, i, arr) => arr.indexOf(x) == i).filter((x) => x != cor_format);
    $: loading = lazy ? 'lazy' : null;
    $: ordered_widths = Array.isArray(widths)
        ? widths
              .filter((x, i, arr) => arr.indexOf(x) == i)
              .sort()
              .reverse()
        : null;
    $: cor_height = height <= 0 ? null : height;
    $: srcset = Array.isArray(ordered_widths)
        ? ordered_widths
              .map((src_width) => {
                  return get_src(src, src_width, cor_height, mode, quality, cor_format, fixed, true);
              })
              .join(', ')
        : null;
    $: srcset_formats =
        Array.isArray(cor_formats) && Array.isArray(ordered_widths)
            ? cor_formats.map((format) => {
                  return {
                      format,
                      srcset: ordered_widths
                          .map((src_width) => get_src(src, src_width, cor_height, mode, quality, format, fixed, true))
                          .join(', '),
                  };
              })
            : [];
</script>

{#if src && width}
    <picture class={css}>
        {#each srcset_formats as entry}
            <source {sizes} srcset={entry.srcset} type="image/{entry.format}" />
        {/each}
        <img
            src={get_src(src, width, cor_height, mode, quality, format, fixed, false)}
            {width}
            height={cor_height}
            {loading}
            {sizes}
            {srcset}
            {alt}
            {style}
        />
    </picture>
{/if}
