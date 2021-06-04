<script>
    wyvr: {
        render: 'hydrate';
    }

    import { onMount } from 'svelte';

    export let price = null;
    export let locale = null;
    export let currency = null;

    export let qty = 1;
    let on_server = true;
    onMount(() => {
        on_server = false;
    });

    $: price_formatted = to_currency(price + '');
    $: sum = to_currency(parseFloat(price + '') * qty);

    function to_currency(price) {
        return parseFloat(price).toLocaleString(locale || 'en', { style: 'currency', currency: currency || 'EUR' });
    }
    function increase() {
        qty++;
    }
    function decrease() {
        qty--;
    }
</script>

<code class="component" class:static={on_server}>
    <div>price: {price_formatted}</div>

    <div class="qty">
        <button on:click={decrease}>-</button>
        <input type="number" bind:value={qty} />
        <button on:click={increase}>+</button>
    </div>
    {#if !on_server}
        <div class="sum">sum: <b>{sum}</b></div>
    {/if}
</code>

<style>
    .static {
        opacity: 0.5;
    }
    .component {
        display: flex;
        align-items: center;
        padding-top: calc(var(--size) * 0.5);
        padding-bottom: calc(var(--size) * 0.5);
    }
    .qty {
        display: flex;
        align-items: stretch;
        margin: 0 var(--size);
    }
    .qty button {
        min-width: calc(var(--size) * 2);
    }
    .qty button:first-child {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }
    .qty button:last-child {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }
    .qty input {
        margin: 0;
        padding: 0 var(--size);
        border: none;
        width: calc(var(--size) * 3);
    }
    .sum b {
        font-size: 1.4rem;
    }
</style>
