import { wyvr_get_dom_path } from 'wyvr/src/resource/dom.js';

const WYVR_INTERACT_EVENTS = ['mouseover', 'mousedown', 'focus', 'focusin', 'pointerover', 'interact'];

export function wyvr_interact(name, elements, fn) {
    if (!window.wyvr_interact) {
        window.wyvr_interact = {};
    }
    window.wyvr_interact[name] = { elements, fn };
    for (const el of elements) {
        for (const ev_name of WYVR_INTERACT_EVENTS) {
            el.addEventListener(ev_name, wyvr_request_interact_init);
        }
        el.setAttribute('data-bind-interact', 'true');
    }
    return {
        interact: (el) => {
            wyvr_request_interact_init({
                target: el,
                type: WYVR_INTERACT_EVENTS[0]
            });
        }
    };
}

function wyvr_request_interact_init(e) {
    let el = e.target;
    let container;
    while (el && el.tagName !== 'HTML') {
        if (el.getAttribute('data-hydrate') && el.getAttribute('data-loading') === 'interact') {
            container = el;
        }
        el = el.parentNode;
    }

    if (!container) {
        return;
    }
    const name = container.getAttribute('data-hydrate');

    if (!window.wyvr_interact[name]?.elements) {
        return;
    }
    for (const ev_name of WYVR_INTERACT_EVENTS) {
        container.removeEventListener(ev_name, wyvr_request_interact_init);
    }
    container.setAttribute('data-bind-interact', null);

    const path = wyvr_get_dom_path(e.target, container);

    let promise;
    if (typeof window.wyvr_interact[name]?.fn === 'function') {
        promise = window.wyvr_interact[name]?.fn(container, name, e);
    }

    // remove the finished element
    window.wyvr_interact[name].elements = window.wyvr_interact[name].elements.filter((item) => item !== container);
    // remove the interact when no elements are left
    if (window.wyvr_interact[name].elements.length === 0) {
        delete window.wyvr_interact[name];
    }

    if (path) {
        // restore original event
        if (promise && typeof promise === 'object' && typeof promise.then === 'function') {
            promise.then(() => {
                wyvr_restore_event(path, e);
            });
            return;
        }
        wyvr_restore_event(path, e);
    }
}

function wyvr_restore_event(path, e) {
    setTimeout(() => {
        let repathed_el;
        try {
            repathed_el = document.querySelector(path);
        } catch (e) {
            console.error(e, path); // eslint-disable-line no-console
        }
        if (repathed_el) {
            let event_name = e.type;
            if (event_name === 'focusin') {
                event_name = 'focus';
            }
            if (repathed_el[event_name]) {
                repathed_el[event_name]();
            }
        }
    }, 100);
}
