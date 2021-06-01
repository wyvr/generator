<script>
    import { onMount } from 'svelte';
    import Counter from '@src/component/Counter.svelte';

    const nav_global = getGlobal('nav.header', []);
    let nav = nav_global ? nav_global.filter((entry) => entry.visible) : null;
</script>

<header>
    <div class="inner">
        <a href="/"><img src="/assets/logo.svg" width="150" height="53" alt="wyvr" class="logo" /></a>
        <Counter />
        {#if $$slots.nav}
            <slot name="nav" />
        {:else if nav}
            <nav>
                <label for="nav-toggle"><span>toggle navigation visibility</span></label>
                <input type="checkbox" id="nav-toggle" />
                <div class="nav__inner">
                    {#each nav as entry}
                        <a href={entry.url}>{entry.name}</a>
                    {/each}
                </div>
            </nav>
        {/if}
    </div>
</header>

<style>
    header {
        background-color: rgba(0, 0, 0, 0.3);
    }
    .inner {
        margin: 0 auto;
        max-width: var(--layout-content-max-width);
        padding: 1rem;
        display: flex;
        align-items: center;
    }
    .logo {
        background-image: radial-gradient(closest-side, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%);
    }
    nav {
        flex-grow: 1;
        text-align: right;
    }
    nav a {
        display: block;
        font-weight: 700;
        text-decoration: none;
        margin: var(--size);
        color: var(--color-text);
    }
    nav > div {
        position: fixed;
        right: 0;
        top: 0;
        bottom: 0;
        background-color: var(--color-primary);
        opacity: 0;
        pointer-events: none;
        text-align: left;
        padding: var(--size);
        transform: translateX(100%);
        transition: transform 0.2s ease-out, opacity 0.2s linear;
        z-index: 1000;
        box-shadow: 0 0 var(--size) rgba(0, 0, 0, 0.75);
    }
    #nav-toggle:checked + div {
        opacity: 1;
        pointer-events: all;
        transform: none;
    }
    #nav-toggle:checked {
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
    #nav-toggle {
        position: fixed;
        top: 0;
        right: 0;
        width: 0;
        height: 0;
        opacity: 0;
        cursor: pointer;
    }
    nav label {
        color: transparent;
        width: calc(var(--size) * 2.5);
        height: calc(var(--size) * 2);
        display: inline-block;
        overflow: hidden;
        position: relative;
        cursor: pointer;
    }
    nav label span {
        overflow: hidden;
        background-color: var(--color-primary);
        width: 100%;
        height: calc(var(--size) * 0.25);
        position: absolute;
        left: 0;
        top: 50%;
        margin-top: calc(var(--size) * -0.1);
    }
    nav label:before,
    nav label:after {
        content: '';
        background-color: var(--color-primary);
        width: 100%;
        height: calc(var(--size) * 0.25);
        position: absolute;
        left: 0;
    }
    nav label:before {
        top: 0;
    }
    nav label:after {
        bottom: 0;
    }
    @media (min-width: 768px) {
        nav label {
            display: none;
        }
        nav a {
            display: inline-block;
            color: var(--color-primary);
        }
        nav > div {
            text-align: right;
            position: static;
            background-color: transparent;
            opacity: 1;
            pointer-events: all;
            padding: 0;
            transform: none;
            box-shadow: none;
        }
    }
</style>
