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
                        if(!in_history(location.pathname)) {
                            send({ action: 'reload', path: location.pathname });
                            add_to_history()
                        }
                        break;
                    case 'ping':
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
    const add_to_history = () => {
        const list = get_history();
        const updated = [location.pathname].concat(list).filter((entry, index, arr)=>arr.indexOf(entry) == index);
        localStorage.setItem('wyvr_socket_history', JSON.stringify(updated))
    }
    const get_history = () => {
        const list = localStorage.getItem('wyvr_socket_history') || "[]";
        return JSON.parse(list);
    }
    const in_history = (url) => {
        return get_history().indexOf(url) > -1
    }

    connect();
    setInterval(() => {
        ping();
    }, 3000);
})();
