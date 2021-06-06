<script>
    import { onMount } from 'svelte';

    const nav_global = getGlobal('nav.header', []);
    let nav = nav_global ? nav_global.filter((entry) => entry.visible) : null;
</script>

<header>
    <div class="inner">
        <a href="/"><img src="/assets/logo.svg" width="150" height="53" alt="wyvr" class="logo" /></a>
        {#if $$slots.nav}
            <slot name="nav" />
        {:else if nav}
            <nav>
                <label for="nav-toggle"><span>toggle navigation visibility</span></label>
                <input type="checkbox" id="nav-toggle" />
                <div class="nav__inner">
                    {#each nav as entry}
                        <a href={entry.url}>{entry.name}</a>
                    {/each}
                </div>
            </nav>
        {/if}
    </div>
</header>
