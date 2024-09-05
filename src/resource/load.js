export function wyvr_load(el, fn) {
    const name = el.getAttribute('data-hydrate');
    if (name && !window.wyvr_classes[name].loaded) {
        window.wyvr_classes[name].loaded = true;
        const script = document.createElement('script');
        script.setAttribute('src', window.wyvr_classes[name].path);
        if (typeof fn === 'function') {
            script.onload = () => fn(script, name, el);
        }
        document.body.appendChild(script);
    }
}
