// @see https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
(function () {
    if (typeof window.CustomEvent === 'function') return false;

    function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: null };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    window.CustomEvent = CustomEvent;
})();

window.trigger = (event_name, data) => {
    if (!event_name) {
        return;
    }
    const params = {
        detail: null,
    };

    if (data) {
        params.detail = data;
    }
    const evt = new CustomEvent(event_name, params);
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
