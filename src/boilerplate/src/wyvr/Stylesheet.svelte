<script>
    /* 
        import Stylesheet from '$src/wyvr/Stylesheet.svelte';

        <Stylesheet src="/assets/global.css" /> 
    */
    import { append_query_string } from '$src/wyvr/append_query_string.js';

    export let src = null;
    export let href = null;
    export let critical = false;
    export let media;

    const timestamp = _inject('config.env') === 'dev' ? Date.now() : undefined;

    $: raw_source = href ?? src;
    $: source = raw_source
        ? append_query_string(raw_source, 'ts', timestamp)
        : undefined;
</script>

{#if source}
    {#if critical}
        <link rel="stylesheet" href={source} {media} />
    {:else}
        <link
            rel="preload"
            href={source}
            as="style"
            onload="this.onload=null;this.rel='stylesheet'"
            {media}
        />
        <noscript><link rel="stylesheet" {href} {media} /></noscript>
    {/if}
{/if}
