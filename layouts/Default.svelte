<script>
    export let data = null;
</script>

<div class="page">
    <header>
        {data.cms_content.header}
    </header>
    <main>
        <slot></slot>
    </main>
    <footer>
        {data.cms_content.footer}
    </footer>
</div>

<style>
    .page {
        margin: 0 auto;
        max-width: 800px;
    }
</style>