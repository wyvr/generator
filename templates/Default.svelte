<script>
    export let data = null;
    export let uniq_id = new Date().getTime();
</script>

<!doctype html />
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{data.title}</title>
        <link href="/assets/global.css?${uniq_id}" rel="stylesheet" />
    </head>
    <body>
        <slot />
        <script src="/bundle.js?${uniq_id}"></script>
    </body>
</html>
