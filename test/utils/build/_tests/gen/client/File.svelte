<script>
    import { onMount } from 'svelte';

    onMount(() => {
        console.log('mounted');
    });
</script>

<b>created</b>

<style>
    b {
        border: 1px solid red;
    }
    a {
        color: blue;
    }
    [data-slot="default"] {
        border: 1px solid blue;
    }
    @import '@src/_test.css';
</style>