<script>
    import Stylesheet from '$src/wyvr/Stylesheet.svelte';
    import Script from '$src/wyvr/Script.svelte';

    export let data = null;
</script>

<!DOCTYPE html>
<html lang={data.$wyvr.language || 'en'}>
    <head>
        <title>{data.title}</title>

        <meta charset="utf-8" />
        <meta
            content="width=device-width,initial-scale=1,minimum-scale=1"
            name="viewport"
        />
        <meta content="telephone=no" name="format-detection" />

        <link rel="icon" href="/assets/favicon.png" />
        <Stylesheet src="/assets/global.css" />
        {#if data.$wyvr.identifier}
            <Stylesheet src="/css/{data.$wyvr.identifier}.css" />
        {/if}
    </head>
    <body>
        <slot />

        {#if data.$wyvr.identifier}
            <Script src="/js/{data.$wyvr.identifier}.js" />
        {/if}
    </body>
</html>

<style>
    body {
        font: 16px/1.4em sans-serif;
    }
</style>
