export function wyvr_trigger(name, elements, fn) {
    if (typeof name === 'string' && name && typeof fn === 'function') {
        window.wyvr[name] = () => {
            for (const el of elements) {
                fn(el);
            }
        };
    }
}

export function wyvr_trigger_elements(name, elements, fn) {
    if (typeof name === 'string' && name && typeof fn === 'function') {
        window.wyvr[name] = () => {
            fn(elements);
        };
    }
}
