window.trigger = (event_name, data, params) => {
    if (!event_name) {
        return;
    }
    if (typeof params != 'object') {
        params = null;
    }
    params = params || {
        bubbles: false,
        cancelable: false,
        detail: null,
    };
    if (data) {
        params.detail = data;
    }
    const evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event_name, params.bubbles, params.cancelable, params.detail);
    document.dispatchEvent(evt);
};
window.on = (event_name, callback) => {
    if (!event_name || !callback) {
        return;
    }
    document.addEventListener(event_name, (e) => {
        const data = e && e.detail ? e.detail : null;
        callback(data);
    });
};
window.off = (event_name, callback) => {
    if (!event_name) {
        return;
    }
    document.removeEventListener(event_name, (e) => {
        const data = e && e.detail ? e.detail : null;
        callback(data);
    });
};
