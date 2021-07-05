<script>
</script>

<p>test</p>

<style type="text/scss">
    @import 'test/lib/client/preprocess_content/scss_import';
    $color: red;

    p {
        @include test($color);
    }
</style>
