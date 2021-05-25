<script>
    export let data = null;
</script>

<!doctype html>
<html lang="{data._wyvr.language}">
    <head>
        <title>{data.title}</title>
        <link rel="icon" href="/assets/favicon.png">
        <link href="/assets/global.css" rel="stylesheet" />
    </head>
    <body>
        <code>Default Doc</code>
        <slot></slot>
    </body>
</html>