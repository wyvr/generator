<script>
    export let data = null;
    import Static from '@src/test/Static.svelte';
    import HydrateInline from '@src/test/HydrateInline.svelte';
    import HydrateBlock from '@src/test/HydrateBlock.svelte';
</script>

{#if data.title}
    <h1>{data.title}</h1>
{/if}
<section>
    <ul>
        <li>Static &raquo;<Static />&laquo;</li>
        <li>Static with prop `data.product`&raquo;<Static value={data.product} />&laquo;</li>
        <li>Hydrate Inline &raquo;<HydrateInline />&laquo;</li>
        <li>Hydrate Block &raquo;<HydrateBlock />&laquo;</li>
    </ul>
</section>
<slot />

<style>
    h1 {
        color: var(--color-primary);
    }
</style>
