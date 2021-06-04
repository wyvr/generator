<script>
    import { onMount } from 'svelte';

    const nav_global = getGlobal('nav.footer', []);
    let nav = nav_global ? nav_global.filter((entry) => entry.visible) : null;

    let buzzwords = getGlobal('faker.buzzwords', []);
</script>

<footer>
    {#if nav}
        <nav>
            <div class="inner">
                {#each nav as entry}
                    <a href={entry.url}>{entry.name}</a>
                {/each}
            </div>
        </nav>
    {/if}
    {#if buzzwords}
        <div class="buzzwords">
            <div class="inner">
                <label for="buzzwords">Buzzwords loaded from global data</label>
                <ul id="buzzwords">
                    {#each buzzwords as buzzword}
                        <li>{buzzword}</li>
                    {/each}
                </ul>
            </div>
        </div>
    {/if}
</footer>

<style>
    footer {
        background-color: rgba(0, 0, 0, 0.75);
    }
    footer a {
        color: #fff;
    }
    nav {
        padding: var(--size);
    }
    .inner {
        margin: 0 auto;
        max-width: var(--layout-content-max-width);
    }
    .buzzwords {
        opacity: 0.75;
        padding: calc(var(--size) * 2) var(--size);
        background-color: rgba(255, 255, 255, 0.1);
    }
    .buzzwords label {
        padding-bottom: calc(var(--size) * 0.25);
        display: inline-block;
    }
    .buzzwords ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .buzzwords li {
        list-style: none;
        margin: 0;
        padding: calc(var(--size) * 0.25);
        display: inline-block;
        border: 1px solid;
        border-radius: calc(var(--size) * 0.25);
        margin-right: calc(var(--size) * 0.25);
    }
</style>
