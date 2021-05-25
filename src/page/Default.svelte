<script>
    export let data = null;
</script>

<code>Default Page</code>

{#if data.title}
    <h1>{data.title}</h1>
{/if}
<slot />

<style>
    h1 {
        color: cornflowerblue;
    }
</style>
