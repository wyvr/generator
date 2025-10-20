import { wyvr_parse_props } from 'wyvr/src/resource/props.js';

export function wyvr_portal(el, props) {
    if (!el) {
        return el;
    }
    const portal_prop = el.getAttribute('data-portal');
    if (portal_prop) {
        return el;
    }
    const portal_target_selector = props[portal_prop];
    if (!portal_target_selector) {
        return el;
    }
    const portal_target = document.querySelector(portal_target_selector);
    if (!portal_target) {
        return el;
    }
    // port all attributes to the new element
    for (const attr of Array.from(el.attributes)) {
        if (attr.name !== 'data-portal') {
            portal_target.setAttribute(attr.name, attr.value);
        }
    }
    portal_target.innerHTML = el.innerHTML;
    el.remove();

    return portal_target;
}

/**
 *
 * @param {NodeListOf<HTMLElementTagNameMap[keyof HTMLElementTagNameMap]>} elements
 * @returns {HTMLElementTagNameMap[keyof HTMLElementTagNameMap][]} array of the portal targets
 */
export function wyvr_portal_targets(elements) {
    const targets = [];
    for (const el of elements) {
        const pre_props = wyvr_parse_props(el);
        const target = wyvr_portal(el, pre_props);
        targets.push(target);
    }
    return targets;
}
