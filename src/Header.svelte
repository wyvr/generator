<script>
    let nav = getGlobal('nav.header');
</script>

<header>
    <div class="inner">
        <a href="/"><img src="/assets/logo.svg" width="150" height="53" alt="wyvr" class="logo" /></a>
        {#if $$slots.nav}
            <slot name="nav" />
        {:else if nav}
            <nav>
                {#each nav as entry}
                    <a href={entry.url}>{entry.name}</a>
                {/each}
            </nav>
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
        display: flex;
        align-items: center;
    }
    .logo {
        background-image: radial-gradient(closest-side, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%);
    }
    nav {
        flex-grow: 1;
        text-align: right;
    }
    nav a {
        display: inline-block;
        font-weight: 700;
        text-decoration: none;
        margin: var(--size);
    }
</style>
