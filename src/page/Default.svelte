<script>
    export let data = null;
</script>

{#if data.title}
    <h1>{data.title}</h1>
{/if}
<slot />

<style>
    h1 {
        color: var(--color-primary);
    }
</style>
