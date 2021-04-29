<script>
    import Header from '$src/Header.svelte';

    export let show_header = true;
</script>

{#if show_header}
    <Header></Header>
{/if}
<main>
    <code>&lt; Default Layout &gt;</code>
    
    <slot></slot>
</main>

<style>
    main {
        margin: 0 auto;
        max-width: 800px;
        padding: 1rem;
    }
</style>