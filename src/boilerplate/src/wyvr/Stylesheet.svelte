<script>
    /* 
        import Stylesheet from '$src/wyvr/Stylesheet.svelte';

        <Stylesheet src="/assets/global.css" /> 
    */

    export let src = null;
    export let critical = false;
    export let media;
</script>

{#if src}
    {#if critical}
        <link rel="stylesheet" href={src} {media} />
    {:else}
        <link
            rel="preload"
            href={src}
            as="style"
            onload="this.onload=null;this.rel='stylesheet'"
            {media}
        />
        <noscript><link rel="stylesheet" href={src} {media} /></noscript>
    {/if}
{/if}
