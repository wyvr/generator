<script>
/* Created with wyvr {{version}} */
import { onMount } from 'svelte';

export let name;

onMount(() => {
    console.log('mounted');
});
</script>

<div class="grid">
    <button
        on:click={() => {
            trigger('my_devtool_close');
        }}
        title="close">Destroy {name}</button
    >
</div>

<style>
    :global(#my_devtool) {
        position: fixed;
        top: 0;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(3px);
        overflow: auto;
    }
</style>
