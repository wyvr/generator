<script>
    export let data = null;
    import Counter from '@src/component/Counter.svelte';
    import Static from '@src/test/Static.svelte';
    import HydrateInline from '@src/test/HydrateInline.svelte';
    import HydrateBlock from '@src/test/HydrateBlock.svelte';
    import HydrateProp from '@src/test/HydrateProp.svelte';
</script>

{#if data.title}
    <h1>{data.title}</h1>
{/if}
<slot />
<section>
    <ul>
        <li>Static <Static /></li>
        <li>Static with prop `data.product` <Static value={data.product} /></li>
        <li>Static with global <Static with_global={true} /></li>
        <li>Hydrate Inline <HydrateInline /></li>
        <li>Hydrate Block <HydrateBlock /></li>
        {#if data.product}
            <li>Hydrate with value from static parent <HydrateProp price={data.product.price} locale={data._wyvr.language} /></li>
        {:else}
            <li>ERROR: Missing product to hydrate with value from static parent</li>
        {/if}
        <li>
            Hydrate with slot <HydrateInline>
                <span>🚀</span>
            </HydrateInline>
        </li>
        <li>
            Hydrate with slot with static component <HydrateInline>
                <Static />
            </HydrateInline>
        </li>
        <li>
            Hydrate with slot with hydrated component <HydrateInline>
                <Counter />
            </HydrateInline>
        </li>
    </ul>
    <h2>TODOs</h2>
    <ul />
</section>

<style>
    h1 {
        color: var(--color-primary);
    }
</style>
