<script>
    /* 
        import Script from '$src/wyvr/Script.svelte';
        
        <Script src="/assets/script.css" /> 
    */

    import { append_query_string } from '$src/wyvr/append_query_string.js';

    export let src = null;
    export let defer = true;

    const timestamp = injectConfig('env') === 'dev' ? Date.now() : undefined;
    const csp = injectConfig('csp.active');

    $: source = src ? append_query_string(src, 'ts', timestamp) : undefined;
    $: nonce = csp ? btoa(source) : undefined;

    $: {
        addCspNonce(nonce);
    }
</script>

{#if source}
    <script {defer} {nonce} src={source}></script>
{/if}
