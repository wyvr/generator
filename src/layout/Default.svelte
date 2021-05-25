<script>
    import Header from '@src/Header.svelte';

    export let data = null;
</script>

{#if data.show_header}
    <Header></Header>
{/if}
<main>
    <code>Default Layout</code>
    
    <slot></slot>
</main>

<style>
    main {
        margin: 0 auto;
        max-width: 800px;
        padding: 1rem;
    }
</style>