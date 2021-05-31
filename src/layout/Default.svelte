<script>
    import Header from '@src/Header.svelte';
    import Footer from '@src/Footer.svelte';

    export let data = null;
</script>

<div class="layout">
    <Header />

    <main>
        <slot />
    </main>

    <Footer />
</div>

<style>
    main {
        margin: 0 auto;
        max-width: var(--layout-content-max-width);
        padding: 1rem;
    }
</style>
