import { wyvr_instant } from 'wyvr/src/resource/instant.js';

export function wyvr_load(el, fn) {
    const name = el.getAttribute('data-hydrate');
    if (!name || !window.wyvr_classes[name].path || el.getAttribute('data-wyvr') === 'done') {
        return;
    }
    if (window.wyvr_classes[name].loaded) {
        if (window.wyvr_classes[name].cls) {
            wyvr_instant(el, window.wyvr_classes[name].cls);
        } else {
            // when class is started to load, but not finished, wait some time
            const saveGuard = setTimeout(() => {
                console.error('could not load class of', el); // eslint-disable-line no-console
                clearInterval(classChecker);
            }, 5000);
            const classChecker = setInterval(() => {
                if (!window.wyvr_classes[name].cls) {
                    return;
                }
                wyvr_instant(el, window.wyvr_classes[name].cls);
                clearInterval(classChecker);
                clearTimeout(saveGuard);
            }, 250);
        }
        return;
    }
    window.wyvr_classes[name].loaded = true;
    const script = document.createElement('script');
    script.setAttribute('src', window.wyvr_classes[name].path);
    script.onload = () => {
        wyvr_instant(el, window.wyvr_classes[name].cls);
        if (typeof fn === 'function') {
            fn(script, name, el);
        }
    };
    document.body.appendChild(script);
}
