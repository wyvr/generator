<script>
    export let value = null;
    export let with_global = false;
</script>

<code class:has_value={value}>
    {#if value}
        <pre>{JSON.stringify(value, null, 4)}</pre>
    {:else}
        Static {#if with_global}
        global `faker.buzzwords[0]` "{getGlobal('faker.buzzwords[0]')}"
        {/if}
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