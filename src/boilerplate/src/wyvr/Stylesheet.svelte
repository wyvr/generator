<script>
    /* 
        import Stylesheet from '$src/wyvr/Stylesheet.svelte';

        <Stylesheet src="/assets/global.css" /> 
    */
    import { append_query_string } from '$src/wyvr/append_query_string.js';

    export let src = null;
    export let critical = false;
    export let media;
    const build_id = _inject('config.build_id', undefined, (value) => {
        if (value) {
            return value.substr(0, 8);
        }
        return value;
    });

    $: href = append_query_string(src, 'bid', build_id);
</script>

{#if href}
    {#if critical}
        <link rel="stylesheet" {href} {media} />
    {:else}
        <link rel="preload" {href} as="style" onload="this.onload=null;this.rel='stylesheet'" {media} />
        <noscript><link rel="stylesheet" {href} {media} /></noscript>
    {/if}
{/if}
