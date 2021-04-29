<script>
</script>

<header>
    <a href="/">wyvr</a>
    {#if $$slots.nav}
        <slot name="nav" />
    {:else}
        <nav>@TODO extract all pages to display them here</nav>
    {/if}
</header>
