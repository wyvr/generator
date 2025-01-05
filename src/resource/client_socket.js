/* eslint-disable no-console*/
(function wyvr_server_communication() {
    window.wyvr_tab_id = sessionStorage.getItem('wyvr_tab_id') || btoa(`${new Date().getTime()}${Math.random()}`);
    sessionStorage.setItem('wyvr_tab_id', window.wyvr_tab_id);

    let open = false;
    const queue = [];
    let errored = false;

    async function run_communication() {
        // avoid multiple connections or avoid connection when page is not active
        if (open || document.hidden) {
            return;
        }
        const instructions = queue.filter(Boolean);
        queue.length = 0;
        // get the messages
        open = true;
        const [err, messages] = await get_bus(instructions);
        open = false;

        // end when error occured or messages are not an array 
        if (err || !Array.isArray(messages)) {
            if (!errored) {
                wyvr_message('connection lost');
            }
            errored = true;
            return
        }
        if (errored) {
            wyvr_message('connection restored')
            errored = false;
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
        // process the messages
        for (const data of messages) {
            process_bus_message(data);
        }
    }

    on('wyvr_devtools_action', (data) => {
        // append the path to the data when it is a rebuild
        if (data?.type === 'rebuild') {
            data.path = get_path();
        }
        queue.push(data);
    });

    setInterval(run_communication, 1000);

    window.wyvr_close_error = (btn) => {
        if (!btn) {
            return;
        }
        const id = btn.getAttribute('data-id');
        if (!id) {
            return;
        }
        errors = errors.filter((e, i) => i !== +id);
    };
})();
