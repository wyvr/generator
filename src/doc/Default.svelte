<script>
    export let data = null;
</script>

<!doctype html />
<html lang={data._wyvr.language || 'en'}>
    <head>
        <title>{data.title}</title>

        <meta charset="utf-8" />
        <meta content="width=device-width,initial-scale=1,minimum-scale=1" name="viewport" />
        <meta content="telephone=no" name="format-detection" />

        <link rel="icon" href="/assets/favicon.png" />
        <link href="/assets/global.css" rel="stylesheet" />
    </head>
    <body>
        <slot />
        {#if data._wyvr.entrypoint}
            <script src="/js/{data._wyvr.entrypoint}.js"></script>
        {/if}
    </body>
</html>
