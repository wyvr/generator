export function wyvr_trigger(name, elements, fn) {
    if (typeof name !== 'string' || !name || typeof fn !== 'function') {
        return;
    }
    window.wyvr[name] = () => {
        for (const el of elements) {
            fn(el);
        }
    };
}
