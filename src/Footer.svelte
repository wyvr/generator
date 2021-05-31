<script>
    import { onMount } from 'svelte';

    let buzzwords = getGlobal('faker.buzzwords');
</script>

<footer>
    <div class="inner">
        {#if buzzwords}
            <div class="buzzwords">
                <label for="buzzwords">Buzzwords loaded from global data</label>
                <ul id="buzzwords">
                    {#each buzzwords as buzzword}
                        <li>{buzzword}</li>
                    {/each}
                </ul>
            </div>
        {/if}
    </div>
</footer>

<style>
    footer {
        background-color: rgba(0, 0, 0, 0.3);
    }
    .inner {
        margin: 0 auto;
        max-width: var(--layout-content-max-width);
        padding: 1rem;
        opacity: 0.5;
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
