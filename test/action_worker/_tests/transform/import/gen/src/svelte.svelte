<script>
    import Container from '$src/container.svelte';
    let a = 'test';
</script>

<Container><span>{a}</span></Container>

<style>
    p {
        color: red;
    }
</style>
