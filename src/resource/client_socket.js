/* eslint-disable no-undef*/
/* eslint-disable no-console*/
(function wyvr_server_communication() {
    // build server connection
    const check_on = setInterval(() => {
        if (window.on) {
            clearInterval(check_on);
            on('wyvr_debug_rebuild', () => {
                send({ action: 'reload', path: location.pathname });
            });
        }
    }, 1000);

    let socket = null;

    const get_path = () => {
        const path = location.pathname;
        // files or correct directories
        if (path.match(/.*\.[^.]+$/) || path.match(/\/$/)) {
            return path;
        }
        return path.trim() + '/';
    };

    const connect = () => {
        const connected = check_state();
        if (!connected) {
            socket = new WebSocket('ws://' + location.hostname + ':{port}');
            socket.onmessage = function (event) {
                check_state();
                let data = event.data;
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error('wyvr socket error parsing data', data);
                }
                switch (data.action) {
                    case 'available': {
                        const path = get_path();
                        send({ action: 'path', path });
                        if (!in_history(path) || window.wyvr_generate_page) {
                            send({ action: 'reload', path });
                            add_to_history();
                        }
                        break;
                    }
                    case 'reload':
                        location.href = location.href;
                        break;
                    case 'error': {
                        if (window.wyvr_generate_timeout) {
                            clearTimeout(window.wyvr_generate_timeout);
                        }
                        const content = document.getElementById('wyvr_error_target');
                        console.error(data.data);
                        window.errors = data.data;
                        if (content) {
                            const html = [
                                '<ul class="wyvr_error_list">',
                                ...data.data.map((line) => {
                                    if (Array.isArray(line)) {
                                        line = line
                                            .map((col) => {
                                                // if (typeof col != 'string') {
                                                //     return JSON.stringify(col, undefined, 4);
                                                // }
                                                return col;
                                            })
                                            .join(' ');
                                    }
                                    return `<li>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>').replace(/\\n/g, '<br>')}</li>`;
                                }),
                                '</ul>',
                            ];
                            content.innerHTML = html.join('');
                            return;
                        }
                        break;
                    }
                    case 'assets':
                        // reload static assets
                        if (Array.isArray(data.list) && data.list.length > 0) {
                            data.list.forEach((asset) => {
                                if (asset.match(/\.css$/)) {
                                    reload_resource(asset, 'link', 'href');
                                }
                                if (asset.match(/\.js$/)) {
                                    reload_resource(asset, 'script', 'src');
                                }
                                if (asset.match(/\.jpg|jpeg|gif|png|webp$/)) {
                                    reload_resource(asset, 'img', 'src');
                                }
                            });
                        }
                        break;
                }
            };
            socket.onclose = function () {
                check_state();
                setTimeout(connect, 5000);
            };
            setTimeout(check_state, 500);
            return false;
        }
        return true;
    };

    const reload_resource = (file_path, tag, attribute) => {
        Array.from(document.querySelectorAll(`${tag}[${attribute}*="${file_path}"]`)).forEach((ref) => {
            const value = ref.getAttribute(attribute);
            if (value) {
                // @see https://stackoverflow.com/questions/2024486/is-there-an-easy-way-to-reload-css-without-reloading-the-page
                ref.setAttribute(attribute, value + '');
            }
        });
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
        return !!open;
    };

    const send = (data) => {
        if (data && connect()) {
            socket.send(JSON.stringify(data));
        }
    };
    const add_to_history = () => {
        const list = get_history();
        const updated = [get_path()]
            .concat(list)
            .filter((entry, index, arr) => arr.indexOf(entry) == index)
            .slice(0, 5);
        localStorage.setItem('wyvr_socket_history', JSON.stringify(updated));
    };
    const get_history = () => {
        const list = localStorage.getItem('wyvr_socket_history') || '[]';
        return JSON.parse(list);
    };
    const in_history = (url) => {
        return get_history().indexOf(url) > -1;
    };

    connect();
})();