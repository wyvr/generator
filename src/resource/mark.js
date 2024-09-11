export function wyvr_mark(elements) {
    if (!elements) {
        return undefined;
    }
    const filtered_elements = [];
    for (const el of elements) {
        if (!el?.getAttribute || el.getAttribute('data-wyvr') !== null) {
            continue;
        }
        el.setAttribute('data-wyvr', 'busy');
        filtered_elements.push(el);
    }
    if (filtered_elements.length === 0) {
        return undefined;
    }

    return filtered_elements;
}
