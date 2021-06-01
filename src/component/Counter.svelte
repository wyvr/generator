<script>
    wyvr: {
        display: 'inline'
        render: 'hydrate'
        name: 'counter'
        bool: true
        number: 10
        array: [ 1, 'entry', false] // ignored
    }

    $: counter = 1;

    function increase() {
        counter++;
    }
</script>

<button on:click={increase}>counter: {counter}</button>

<style>
    button {
        margin: var(--size);
    }
</style>