<script>
    // wyvr.display = 'block' is default
    wyvr: {
        render: 'hydrate';
    }

    import { onMount } from 'svelte';

    let date = update_date();
    let on_server = true;

    onMount(() => {
        on_server = false;
        date = update_date();
        setInterval(() => {
            date = update_date();
        }, 1000);
    });
    function update_date() {
        const d = new Date();
        return `${leading_zero(d.getHours())}:${leading_zero(d.getMinutes())}:${leading_zero(d.getSeconds())}`;
    }
    function leading_zero(value, amount) {
        if (isNaN(amount)) {
            amount = 2;
        }
        let zero = '';
        for (; amount > 0; amount--) {
            zero += '0';
        }
        return (zero + value).slice(-zero.length);
    }
</script>

<code class:static="{on_server}">{date}</code>

<style>
    code {
        display: block;
    }
    .static {
        opacity: 0.5;
    }
</style>
