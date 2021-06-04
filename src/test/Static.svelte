<script>
    export let value = null;
</script>

<code class:has_value={value}>
    {#if value}
        <pre>{JSON.stringify(value, null, 4)}</pre>
    {:else}
        Static
    {/if}
</code>

<style>
    .has_value {
        display: block;
    }
    pre {
        margin: 0;
        padding:0;
    }
</style>