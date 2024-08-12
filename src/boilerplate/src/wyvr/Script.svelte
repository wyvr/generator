<script>
    /* 
        import Script from '$src/wyvr/Script.svelte';
        
        <Script src="/assets/script.css" /> 
    */

    import { append_query_string } from '$src/wyvr/append_query_string.js';

    export let src = null;
    export let defer = true;

    const timestamp = _inject('config.env') === 'dev' ? Date.now() : undefined;

    $: source = src ? append_query_string(src, 'ts', timestamp) : undefined;
</script>

{#if source}
    <script {defer} src={source}></script>
{/if}
