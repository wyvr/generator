// send request to the server
async function get_bus(queue) {
    let data = undefined;
    try {
        data = JSON.stringify(queue)
    } catch (e) {
        console.error(e);
    }
    try {
        const res = await fetch(`/$bus/?${new Date().getTime()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: data
        });
        const json = await res.json();
        set_socket_state(true)
        return [undefined, json];
    } catch (e) {
        set_socket_state(false)
        return [e, undefined];
    }
}

// process messages from the server
function process_bus_message(data) {
    if (data.reload) {
        return reload(data.reload);
    }
    if (data.warning) {
        console.warn(...data.warning.message);
        return;
    }
    if (data.error) {
        console.error(...data.error.message);
        return;
    }
    if (data.config || data.package_tree) {
        trigger('wyvr_devtools_action_result', data);
        return;
    }
}

function set_socket_state(connected) {
    if (!wyvrDebugToolbar) {
        return;
    }
    const toolbar = wyvrDebugToolbar.querySelector('.wyvr_debug_toolbar');
    if (toolbar) {
        if (connected) {
            toolbar.classList.add('connected');
            toolbar.classList.remove('disconnected');
        } else {
            toolbar.classList.remove('connected');
            toolbar.classList.add('disconnected');
        }
    }
}

function reload(list) {
    if (Array.isArray(list) && list.length > 0) {
        for (const asset of list) {
            if (asset.match(/\.css$/)) {
                reload_resource(asset, 'link', 'href');
                continue;
            }
            if (asset.match(/\.js$/)) {
                reload_resource(asset, 'script', 'src');
                continue;
            }
            if (asset.match(/\.jpg|jpe|jpeg|gif|png|webp|avif|heif$/)) {
                reload_resource(asset, 'img', 'src');
                reload_resource(asset, 'link', 'href');
            }
        }
    }
    // reload page
    if (list === '*') {
        location.reload();
    }
}
// reload a client resource
function reload_resource(file_path, tag, attribute) {
    for (const ref of document.querySelectorAll(`${tag}[${attribute}*="${file_path}"]`)) {
        const value = ref.getAttribute(attribute);
        if (value) {
            if (file_path.indexOf('.js') >= 0) {
                location.reload();
                return;
            }
            // @see https://stackoverflow.com/questions/2024486/is-there-an-easy-way-to-reload-css-without-reloading-the-page
            // add cache breaker to the resource
            const cb = new Date().getTime().toString();
            ref.setAttribute(attribute, value + (value.indexOf('?') > -1 ? '&' : '?') + cb);
        }
    }
}

function get_path() {
    const path = location.pathname;
    // files or correct directories
    if (path.match(/.*\.[^.]+$/) || path.match(/\/$/)) {
        return path;
    }
    return `${path.trim()}/`;
}