<script>
    import Header from '$src/component/Header.svelte';
    import Footer from '$src/component/Footer.svelte';
    import { huhu } from '$src/nonexisting';

    export let data = null;
</script>

<div class="layout">
    <div class="fullheight">
        <Header />
        {huhu(data.title)}

        <main>
            <slot />
        </main>
    </div>
    <Footer {data} />
</div>
