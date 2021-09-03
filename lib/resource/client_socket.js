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
                // console.log('receive', data);
                switch (data.action) {
                    case 'available':
                        send({ action: 'path', path: location.pathname });
                        // localStorage.setItem('wyvr_socket_avoid_reload', 'true');
                        // if(document.referrer != location.href) {
                        //     location.href = location.href
                        // }
                        break;
                    case 'ping':
                        // console.log(data.id)
                        // const id = sessionStorage.getItem('wyvr_socket_id');
                        // if(data.id != id) {
                        //     console.log('different ids', data.id, id)
                        //     sessionStorage.setItem('wyvr_socket_id', data.id)
                        //     if(document.referrer != location.href) {
                        //         location.href = location.href
                        //     }
                        // }
                        break;
                    case 'reload':
                        location.href = location.href;
                        break;
                }
            };
            return false;
        }
        return true;
    };

    const check_state = () => {
        const toolbar = document.querySelector('.wyvr_debug_toolbar');
        const open = socket && socket.readyState === socket.OPEN;
        if (toolbar) {
            if (open) {
                toolbar.classList.add('connected');
                toolbar.classList.remove('disconnected');
            } else {
                toolbar.classList.remove('connected');
                toolbar.classList.add('disconnected');
            }
        }
        return open;
    };

    const send = (data) => {
        if (data && connect()) {
            // console.log('send', data)
            socket.send(JSON.stringify(data));
        }
    };
    const ping = () => {
        send({ action: 'ping' });
    };

    connect();
    setInterval(() => {
        ping();
    }, 3000);
})();
