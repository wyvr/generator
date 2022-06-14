<script>
    import Container from '[root]/test/worker_action/_tests/transform/gen/src/container.svelte';
    let a = 'test';
function test(a) {
    return '#' + a;
}
</script>

<Container><span>{a}</span></Container>


<style>p {
    border: 1px solid red;
}
    p {
        color: red;
    }
</style>