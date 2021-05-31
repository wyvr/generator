<script>
    import Header from '@src/Header.svelte';
    import Footer from '@src/Footer.svelte';

    export let data = null;
</script>

<div class="layout">
    <div class="fullheight">
        <Header />
        
        <main>
            <slot />
        </main>
    </div>

    <Footer />
</div>

<style>
    main {
        margin: 0 auto;
        max-width: var(--layout-content-max-width);
        padding: 1rem;
    }
    .fullheight {
        min-height: 100vh;
    }
</style>
