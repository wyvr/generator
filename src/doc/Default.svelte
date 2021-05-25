<script>
    export let data = null;
</script>

<!doctype html>
<html lang="{data._wyvr.language}">
    <head>
        <title>{data.title}</title>
    </head>
    <body>
        <code>&lt; Default Doc &gt;</code>
        <slot></slot>
    </body>
</html>