<script>
</script>

<code>
    <button>Button with SASS Syntax</button>
</code>

<style type="text/scss">
    @import '@src/test';

    code {
        display: block;
    }
    button {
        @include button();
    }
</style>
