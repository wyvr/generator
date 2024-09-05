export function wyvr_get_dom_path(el, parent) {
    const stack = [];
    const id = `${parent.getAttribute('data-hydrate-path')}_${new Date().getTime()}`;
    // set the unique value only once
    if (!parent.getAttribute('data-hydrate-id')) {
        parent.setAttribute('data-hydrate-id', id);
    }
    while (el !== parent && el !== undefined) {
        let sibCount = 1;
        let sibIndex = 0;
        for (let i = 0; i < el.parentNode.childNodes.length; i++) {
            const sib = el.parentNode.childNodes[i];
            if (sib.nodeName === el.nodeName) {
                if (sib === el) {
                    sibIndex = sibCount;
                    break;
                }
                sibCount++;
            }
        }
        if (!el.getAttribute('data-hydrate')) {
            const el_nodename = el.nodeName.toLowerCase();
            if (el.hasAttribute('id') && el.id !== '') {
                stack.unshift(`${el_nodename}#${el.id}`);
            } else if (sibCount > 1) {
                stack.unshift(`${el_nodename}:nth-child(${sibIndex})`);
            } else {
                stack.unshift(el_nodename);
            }
        }
        el = el.parentNode;
    }
    stack.unshift(`[data-hydrate-id="${id}"]`); // add it with the id as root
    return stack.join('>');
}
