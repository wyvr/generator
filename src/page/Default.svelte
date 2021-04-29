<script>
    export let headline = 'wyvr';
</script>

<code>&lt; Default Page &gt;</code>

{#if headline}
    <h1>{headline}</h1>
{/if}
<slot />

<style>
    h1 {
        color: cornflowerblue;
    }
</style>
