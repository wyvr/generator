<script>
</script>

<header>
    <div class="inner">
        <a href="/"><img src="/assets/logo.svg" width="150" height="53" alt="wyvr" class="logo" /></a>
        {#if $$slots.nav}
            <slot name="nav" />
        {:else}
            <!-- <nav>@TODO extract all pages to display them here</nav> -->
        {/if}
    </div>
</header>

<style>
    header {
        background-color: rgba(0, 0, 0, 0.3);
    }
    .inner {
        margin: 0 auto;
        max-width: var(--layout-content-max-width);
        padding: 1rem;
    }
    .logo {
        background-image: radial-gradient(closest-side, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%);;
    }
</style>
