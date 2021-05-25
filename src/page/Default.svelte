<script>
    export let data = null;
</script>

<code>&lt; Default Page &gt;</code>

{#if data.title}
    <h1>{data.title}</h1>
{/if}
<slot />

<style>
    h1 {
        color: cornflowerblue;
    }
</style>
