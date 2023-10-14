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

    import { get_image_src_data, get_image_src, correct_image_format } from '@src/wyvr/image_utils.js';
    import { onMount } from 'svelte';
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

    let domain_config;
    let media;
    let media_cache;
    let show_image = true;

    onServer(async () => {
        const { get_cache_keys } = await import('@wyvr/generator/src/utils/media.js');
        media_cache = get_cache_keys();
        set_media();
    });

    onMount(() => {
        media_cache = window?._media;
        set_media();
    });

    $: loading = lazy ? 'lazy' : null;

    // update the media if something changes which has effect on the image urls or the used sources
    $: set_media(src, width, height, format, quality, widths, mode, fixed);

    function set_media() {
        // avoid images without source or without extensionless source
        if (!src || !src.match(/\.[^.]{3,5}$/)) {
            show_image = false;
            return undefined;
        }
        if (!media_cache) {
            return;
        }
        domain_config = Object.values(media_cache).find((value) => src.indexOf(value.domain) == 0);
        if (domain_config) {
            media = get_media(src, width, height, format, quality, widths, mode, fixed);
        }
    }

    function get_media(src, width, height, format, quality, widths, mode, fixed) {
        // get the corrected values
        const cor_height = height <= 0 ? null : height;
        const cor_format = correct_image_format(format, src);
        const cor_formats = ['webp'].filter((x, i, arr) => arr.indexOf(x) == i).filter((x) => x != cor_format);
        // build image data, to avoid passing a lot of parameters around
        const data = {
            src: undefined,
            width,
            height: cor_height,
            format: cor_format,
            quality,
            mode,
        };
        if (domain_config) {
            // remove domain from the source
            data.src = src.replace(domain_config.domain, '');
        }
        if (domain_config && data.src.indexOf('http') > -1) {
            // something went terrible wrong
            Logger.error('domain could not be removed from the media', src);
        }
        // order the widths from highest to lowest
        const ordered_widths = Array.isArray(widths)
            ? widths
                  .filter((x, i, arr) => arr.indexOf(x) == i)
                  .sort()
                  .reverse()
            : undefined;
        // get the srcset for the main image
        const srcset = to_srcset(ordered_widths, data);
        // get the srcsets for the other formats
        const formats = to_srcsets(cor_formats, ordered_widths, data);

        return {
            src: get_src(data.src, width, cor_height, mode, quality, cor_format, fixed, false),
            height: cor_height,
            format: cor_format,
            formats,
            srcset,
        };
    }

    function get_src(src, w, h, m, q, f, use_width) {
        const data = get_image_src_data(src, w, h, m, q, f, fixed, use_width, width);
        if (!data) {
            return '';
        }
        return get_image_src(data.src, data.config, domain_config?.hash) + data.width_addition;
    }
    function to_srcset(ordered_widths, data) {
        if (!Array.isArray(ordered_widths)) {
            return undefined;
        }
        return ordered_widths
            .map((src_width) => {
                return get_src(
                    data.src,
                    src_width,
                    data.height,
                    data.mode,
                    data.quality,
                    data.format,
                    data.fixed,
                    true
                );
            })
            .join(', ');
    }
    function to_srcsets(formats, ordered_widths, data) {
        if (!Array.isArray(formats)) {
            return [];
        }
        return formats
            .map((format) => {
                const new_data = { ...data };
                new_data.format = format;
                const srcset = to_srcset(ordered_widths, data);
                if (!srcset) {
                    return undefined;
                }
                return {
                    format,
                    srcset,
                };
            })
            .filter(Boolean);
    }
</script>

{#if show_image}
    {#if media}
        <picture class={css}>
            {#each media.formats as format}
                <source {sizes} srcset={format.srcset} type="image/{format.format}" />
            {/each}
            <img src={media.src} {width} height={media.height} {loading} {sizes} srcset={media.srcset} {alt} {style} />
        </picture>
    {:else}
        <img {src} {width} {height} {loading} {alt} style="border:1px solid red;{style}" />
    {/if}
{/if}
