<script>
    import Header from '@src/component/Header.svelte';
    import Footer from '@src/component/Footer.svelte';

    export let data = null;
</script>

<div class="layout">
    <div class="fullheight">
        <Header />
        
        <main>
            <slot />
        </main>
    </div>
    <Footer data={data} />
</div>
