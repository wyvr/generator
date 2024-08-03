<script>
    /* 
        import Script from '$src/wyvr/Script.svelte';
        
        <Script src="/assets/script.css" /> 
        */
    import { append_query_string } from '$src/wyvr/append_query_string.js';

    export let src = null;
    export let defer = true;
    const build_id = _inject('config.build_id', undefined, (value) => {
        if (value) {
            return value.substr(0, 8);
        }
        return value;
    });

    $: href = append_query_string(src, 'bid', build_id);
</script>

{#if href}
    <script {defer} src={href}></script>
{/if}
