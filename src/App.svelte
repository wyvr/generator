<script>
    export let name = 'world';
    export let details = false;
</script>

<h1>Hello {name}!</h1>
{#if details}<p>some details</p>{/if}
<slot></slot>