<script>
    import { get_parent_node } from './wyvr_inspect/helper.mjs';

    export let key;
    export let value;
    export let type = 'text';

    function copy(e) {
        const cell = get_parent_node(e.target, (target) => target.tagName.toLowerCase() == 'td');
        if (!cell) {
            return;
        }
        let text = cell.querySelector('div') ? cell.querySelector('div').innerText : cell.innerText;
        if (typeof text == 'string') {
            text = text.replace(/^"(.*)"$/, '$1');
        }
        navigator.clipboard.writeText(text).then(() => {
            wyvr_message('copied to clipboard');
        });
    }
    function trigger(value) {
        window.wyvr[value]();
        wyvr_message('triggered ' + value);
    }
</script>

<tr>
    <th>{key}</th>
    <td>
        <div>
            {#if type == 'config' && key == 'trigger'}
                <button
                    class="btn"
                    title="trigger wyvr.{value}()"
                    on:click={() => {
                        trigger(value);
                    }}><em>wyvr.</em>{value}()</button
                >
            {:else if type == 'json' || type == 'config'}
                <pre>{JSON.stringify(value, null, 4)}</pre>
            {:else}
                <pre>{value}</pre>
            {/if}
        </div>
        <button on:click={copy} class="btn copy">copy</button>
    </td>
</tr>

<style>
    pre {
        margin: 0;
        padding: 0;
        font-size: var(--wyvr-debug-font-size);
        font-family: monospace;
    }
    td,
    th {
        overflow: hidden;
        padding: calc(var(--size) * 0.25) calc(var(--size) * 0.5);
    }
    th {
        width: 0;
        text-align: left;
        white-space: nowrap;
        border-top-left-radius: var(--radius);
        border-bottom-left-radius: var(--radius);
        background-color: var(--wyvr-debug-primary);
        color: var(--wyvr-debug-text);
    }
    td {
        background: rgba(255, 255, 255, 0.1);
        position: relative;
    }
    tr td:last-child {
        border-top-right-radius: var(--radius);
        border-bottom-right-radius: var(--radius);
    }
    .btn {
        font-size: var(--wyvr-debug-font-size);
        font-family: monospace;
        background: var(--wyvr-debug-bg);
        border: 1px solid var(--wyvr-debug-primary);
        color: var(--wyvr-debug-primary);
        cursor: pointer;
        border-radius: var(--radius);
    }
    .copy {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        right: 2px;
        opacity: 0;
        transition: opacity 0.2s linear !important;
    }
    td:hover .copy {
        opacity: 1;
    }
</style>
