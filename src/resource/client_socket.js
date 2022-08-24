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
    let errors = [];

    window.wyvr_close_error = function (btn) {
        if (!btn) {
            return;
        }
        const id = btn.getAttribute('data-id');
        if (!id) {
            return;
        }
        errors = errors.filter((e, i) => i != +id);
        wyvr_update_errors();
    };

    function get_path() {
        const path = location.pathname;
        // files or correct directories
        if (path.match(/.*\.[^.]+$/) || path.match(/\/$/)) {
            return path;
        }
        return path.trim() + '/';
    }
    function connect() {
        const connected = check_state();
        if (!connected) {
            socket = new WebSocket('ws://' + location.hostname + ':{port}');
            socket.onmessage = function (event) {
                console.log(event);
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
                        console.log(data);
                        reload(data.data);
                        break;
                    case 'warning': {
                        console.warn(data.data.char, data.data.message);
                        break;
                    }
                    case 'error': {
                        // if (window.wyvr_generate_timeout) {
                        //     clearTimeout(window.wyvr_generate_timeout);
                        // }
                        errors.push(data.data.message);
                        if (!wyvr_update_errors()) {
                            console.error(data.data.char, ...data.data.message);
                        }
                        break;
                    }
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
    }
    function wyvr_update_errors() {
        const content = document.getElementById('wyvr_error_target');

        if (!content) {
            return false;
        }
        const html = [
            '<ul class="wyvr_error_list">',
            ...errors.map((line, index) => {
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
                return `<li>${line
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\n/g, '<br>')
                    .replace(/\\n/g, '<br>')}<button onclick="wyvr_close_error(this)" data-id="${index}" title="close"></button></li>`;
            }),
            '</ul>',
        ];
        content.innerHTML = html.join('');
        return true;
    }
    function check_state() {
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
    }
    function send(data) {
        if (data && connect()) {
            socket.send(JSON.stringify(data));
        }
    }
    function add_to_history() {
        const list = get_history();
        const updated = [get_path()]
            .concat(list)
            .filter((entry, index, arr) => arr.indexOf(entry) == index)
            .slice(0, 5);
        localStorage.setItem('wyvr_socket_history', JSON.stringify(updated));
    }
    function get_history() {
        const list = localStorage.getItem('wyvr_socket_history') || '[]';
        return JSON.parse(list);
    }
    function in_history(url) {
        return get_history().indexOf(url) > -1;
    }
    function reload(list) {
        if (Array.isArray(list) && list.length > 0) {
            list.forEach((asset) => {
                if (asset.match(/\.css$/)) {
                    reload_resource(asset, 'link', 'href');
                    return;
                }
                if (asset.match(/\.js$/)) {
                    reload_resource(asset, 'script', 'src');
                    return;
                }
                if (asset.match(/\.jpg|jpe|jpeg|gif|png|webp|avif|heif$/)) {
                    reload_resource(asset, 'img', 'src');
                    reload_resource(asset, 'link', 'href');
                    return;
                }
            });
        }
        // reload page
        if (list === '*') {
            location.reload();
        }
    }
    function reload_resource(file_path, tag, attribute) {
        Array.from(document.querySelectorAll(`${tag}[${attribute}*="${file_path}"]`)).forEach((ref) => {
            const value = ref.getAttribute(attribute);
            if (value) {
                // @see https://stackoverflow.com/questions/2024486/is-there-an-easy-way-to-reload-css-without-reloading-the-page
                ref.setAttribute(attribute, value + '');
            }
        });
    }

    connect();
})();
