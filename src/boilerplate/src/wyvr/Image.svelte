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

    import { isClient, isServer, onServer } from '@wyvr/generator';
    export let src = null;
    export let width = 0;
    export let height = 0;
    export let alt = '';
    export let format = null;
    export let quality = 60;
    export let sizes = null;
    export let widths = null;
    export let css = null;
    export let lazy = true;
    export let mode = 'cover';
    export let fixed = false;

    function get_src(src, w, h, m, q, f, use_width) {
        if (!src) {
            return '';
        }
        let height = '';
        const width_addition = use_width ? ` ${w}w` : '';
        if(h > 0) {
            height = fixed ? h : (h / width) * w;
        }
        if (isServer) {
            return `(media(src:'${src}', width: ${w}, ${height ? `height: ${height},` : ''} mode: '${m}', quality: ${q}, format: '${f}'))${width_addition}`;
        }
        if (isClient) {
            const hash_config = {
                mode: 'cover',
                format: 'jpeg',
            };
            if (w) {
                hash_config.width = w;
            }
            if (h > 0) {
                hash_config.height = h;
            }
            if (q) {
                hash_config.quality = q;
            }
            if (m) {
                hash_config.mode = m;
            }
            const extension = src.match(/\.([^\.]+)$/);
            if (!f && extension && extension[1] != hash_config.format) {
                f = extension[1];
            }
            if (f) {
                if (f == 'jpg') {
                    f = 'jpeg';
                }
                hash_config.format = f;
            }
            const hash = get_hash(JSON.stringify(hash_config));

            if (src.indexOf('http') == 0) {
                const domain_match = src.match(/^https?:\/\/([^\/]*?)\//);
                if (domain_match) {
                    const domain = domain_match[1];
                    const domain_hash = get_hash(domain);
                    if (domain_hash) {
                        const src_path = src.substring(src.indexOf(domain) + domain.length).replace(/^\//, '');
                        return `/media/_d/${domain_hash}/${hash}/${src_path}${width_addition}`;
                    }
                }
            }
            return `/media/${hash}/${src.replace(/^\//, '')}${width_addition}`;
        }
        return src;
    }
    function get_hash(value) {
        return btoa(value);
    }
    function correct_format(format) {
        if (!format) {
            return null;
        }
        format = format.toLowerCase();
        switch (format) {
            case 'jpg':
                return 'jpeg';
            case 'gif':
            case 'png':
            case 'jpeg':
            case 'webp':
            case 'avif':
            case 'heif':
                return format;
        }
        return null;
    }

    $: cor_format = correct_format(format);
    $: cor_formats = ['webp'].filter((x, i, arr) => arr.indexOf(x) == i).filter((x) => x != cor_format);
    $: loading = lazy ? 'lazy' : null;
    $: ordered_widths = Array.isArray(widths)
        ? widths
              .filter((x, i, arr) => arr.indexOf(x) == i)
              .sort()
              .reverse()
        : null;
    $: cor_height = height <= 0 ? null : height
    $: srcset = Array.isArray(ordered_widths) ? ordered_widths.map((src_width) => {
        return get_src(src, src_width, cor_height, mode, quality, cor_format, true)
    }).join(', ') : null;
    $: srcset_formats =
        Array.isArray(cor_formats) && Array.isArray(ordered_widths)
            ? cor_formats.map((format) => {
                  return {
                      format,
                      srcset: ordered_widths.map((src_width) => get_src(src, src_width, cor_height, mode, quality, format, true)).join(', '),
                  };
              })
            : [];
</script>

{#if src && width}
    <picture class={css}>
        {#each srcset_formats as entry}
            <source {sizes} srcset={entry.srcset} type="image/{entry.format}" />
        {/each}
        <img src={get_src(src, width, cor_height, mode, quality, format, false)} {width} height={cor_height} {loading} {sizes} {srcset} {alt} />
    </picture>
{/if}
