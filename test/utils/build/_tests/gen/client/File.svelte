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
    @import '@src/_test.css';
</style>