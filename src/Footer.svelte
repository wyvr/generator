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
