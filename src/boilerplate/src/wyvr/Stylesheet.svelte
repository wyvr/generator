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

    const is_dev = injectConfig('env') === 'dev';
    const timestamp = is_dev ? Date.now() : undefined;
    const csp = injectConfig('csp.active');

    $: raw_source = href ?? src;
    $: source = raw_source
        ? append_query_string(raw_source, 'ts', timestamp)
        : undefined;

    $: nonce = source ? btoa(source) : '';
    $: nonceAttr = csp ? ` nonce="${nonce}"` : '';
    $: scriptContent = source
        ? `<script${nonceAttr}>document.getElementById('${nonce}').addEventListener('load', (e) => { e.target.rel = 'stylesheet'; }, { once: true })<\/script>`
        : '';

    $: {
        addCspNonce(nonce);
    }
</script>

{#if source}
    {#if critical}
        <link rel="stylesheet" href={source} {media} />
    {:else}
        <link rel="preload" href={source} as="style" {media} id={nonce} />
        <noscript><link rel="stylesheet" href={source} {media} /></noscript>
        {@html scriptContent}
    {/if}
{/if}
