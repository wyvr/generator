<script>
	export let a = false;
</script>

{#if a}
<span class="green">awesome</span>
{:else}
<span class="red">missing</span>
{/if}

<style>
	.green {
		color: green;
	}
	.red {
		color: red;
	}
</style>
