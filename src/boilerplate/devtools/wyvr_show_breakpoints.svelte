<script>
    export let breakpoints = [];

    let css;
    let entries = [];
    $: {
        const bp = breakpoints.sort().reverse();

        entries = bp.map((position, index) => {
            return { position, color: '#6d8ddf', index };
        });

        const lines = entries
            .map((entry) => `linear-gradient(to right, ${entry.color} 1px, transparent 1px, transparent)`)
            .join(',');
        const positions = bp.map((width) => `${width}px 0`).join(',');

        css = `--breakpoint-lines: ${lines}; --breakpoint-positions: ${positions};`;
    }
</script>

<div class="container" style={css}>
    {#each entries as entry}
        <div
            class="entry"
            style="--breakpoint-color: {entry.color}; --breakpoint-index: {entry.index}; --breakpoint-position: {entry.position}px;"
        >
            {entry.position}
        </div>
    {/each}
</div>

<style>
    .container {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 10000;
        pointer-events: none;
        background-image: var(--breakpoint-lines);
        background-position: var(--breakpoint-positions);
        background-repeat: no-repeat;
        overflow: hidden;
    }
    .entry {
        background-color: var(--breakpoint-color);
        position: absolute;
        left: min(100vw, var(--breakpoint-position));
        transform: translateX(-100%);
        padding: 0.2em 0.5em;
        margin-left: -20px;
        margin-top: 10px;
        top: calc(1.5em * var(--breakpoint-index));
        font-size: 1em;
        border-radius: calc(var(--size) * 0.125);
        line-height: 1em;
        color: #000;
        font-weight: 700;
        font-family: monospace;
    }
    .entry:after {
        content: '';
        position: absolute;
        left: 100%;
        top: calc(0.7em - 1px);
        width: 20px;
        border-bottom: 2px solid var(--breakpoint-color);
    }
</style>
