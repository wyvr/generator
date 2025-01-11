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

    const csp = injectConfig('csp.active');
    //const onload = csp ? undefined : 'this.onload=null;this.rel="stylesheet"';

    $: raw_source = href ?? src;
    $: source = raw_source
        ? append_query_string(raw_source, 'ts', timestamp)
        : undefined;

    let nonce = null;
    let id = null;
    let scriptContent = null;
    $: {
        if (csp) {
            nonce = btoa(source);
            id = nonce;
            addCspNonce(nonce);
            scriptContent = `<script nonce="${nonce}">document.getElementById('${nonce}').addEventListener('load', (e) => { e.target.rel = 'stylesheet'; }, { once:true })<\/script>`
        }
    }

</script>

{#if source}
    {#if critical}
        <link rel="stylesheet" href={source} {media} />
    {:else}
        <link rel="preload" href={source} as="style" {media} {id} />
        <noscript><link rel="stylesheet" href={source} {media} /></noscript>
        {#if csp}
            {@html scriptContent}
        {/if}
    {/if}
{/if}
