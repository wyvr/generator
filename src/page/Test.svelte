<script>
    export let data = null;
    import Static from '@src/test/Static.svelte';
    import HydrateInline from '@src/test/HydrateInline.svelte';
    import HydrateBlock from '@src/test/HydrateBlock.svelte';
</script>

{#if data.title}
    <h1>{data.title}</h1>
{/if}
<slot />
<section>
    <ul>
        <li>Static &raquo;<Static />&laquo;</li>
        <li>Static with prop `data.product`&raquo;<Static value={data.product} />&laquo;</li>
        <li>Static with global &raquo;<Static with_global={true} />&laquo;</li>
        <li>Hydrate Inline &raquo;<HydrateInline />&laquo;</li>
        <li>Hydrate Block &raquo;<HydrateBlock />&laquo;</li>
    </ul>
    <h2>TODOs</h2>
    <ul>
        <li>Hydrate with value from static parent</li>
        <li>Hydrate with slot</li>
    </ul>
</section>

<style>
    h1 {
        color: var(--color-primary);
    }
</style>
