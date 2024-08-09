<script>
/* 
        import Script from '$src/wyvr/Script.svelte';
        
        <Script src="/assets/script.css" /> 
    */

export let src = null;
export let defer = true;
</script>

{#if src}
    <script {defer} {src}></script>
{/if}
