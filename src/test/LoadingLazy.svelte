<script>
    wyvr: {
        render: 'hydrate'
        loading: 'lazy'
    }

    import { onMount } from 'svelte';

    let on_server = true;

    onMount(() => {
        on_server = false;
    });
    
</script>

<code class:static={on_server}>
    {#if on_server}
        <div>Xxxxxx 🙈</div>
    {:else}
        <div>Loaded ✅</div>
    {/if}
</code>

<style>
    code {
        display: block;
    }
    .static {
        opacity: 0.5;
    }
</style>
