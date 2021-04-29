<script>
    export let language = 'en';
    export let title = 'wyvr';
</script>

<!doctype html>
<html lang="{language}">
    <head>
        <title>{title}</title>
    </head>
    <body>
        <code>&lt; Default Doc &gt;</code>
        <slot></slot>
    </body>
</html>