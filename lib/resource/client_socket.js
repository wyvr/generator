(function wyvr_server_communication() {
    // build server connection
    let socket = null;

    const connect = () => {
        if (!check_state()) {
            socket = new WebSocket('ws://127.0.0.1:{port}');
            socket.onmessage = async function (event) {
                let data = event.data;
                try {
                    data = JSON.parse(data);
                } catch (e) {}
                switch (data.action) {
                    case 'available':
                        send({ action: 'path', path: location.pathname });
                        // if(document.referrer != location.href) {
                        //     location.href = location.href
                        // }
                        break;
                    case 'ping':
                        break;
                    case 'reload':
                        location.href = location.href
                        break;
                }
            };
        }
    };

    const check_state = () => {
        const icon = document.querySelector('.wyvr_debug_toolbar>span>img');
        const open = socket && socket.readyState === socket.OPEN;
        if (icon) {
            if (open) {
                icon.removeAttribute('style');
            } else {
                icon.setAttribute('style', 'filter: grayscale(1);');
            }
        }
        return open;
    };

    const send = (data) => {
        connect();
        if (data && check_state()) {
            socket.send(JSON.stringify(data));
        }
    };
    const ping = () => {
        send({ action: 'ping' });
    };

    connect();
    setInterval(() => {
        ping();
    }, 5000);
})();
