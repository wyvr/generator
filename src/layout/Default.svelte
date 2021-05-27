<script>
    import Header from '@src/Header.svelte';

    export let data = null;
</script>

<div class="layout">
    <Header></Header>
    
    <main>
        <slot></slot>
    </main>
</div>

<style>
    main {
        margin: 0 auto;
        max-width: var(--layout-content-max-width);
        padding: 1rem;
    }
</style>