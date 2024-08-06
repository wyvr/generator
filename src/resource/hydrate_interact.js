/* eslint-disable no-console */

import { wyvr_portal } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_props } from '@wyvr/generator/src/resource/props.js';

const wyvr_interact_classes = {};

export function wyvr_hydrate_interact(path, elements, name, cls, trigger) {
    wyvr_interact_classes[name] = { cls, path, loaded: false };

    for (const el of elements) {
        el.addEventListener('mouseover', wyvr_interact_init);
        el.addEventListener('mousedown', wyvr_interact_init);
        el.addEventListener('focusin', wyvr_interact_init);
        el.addEventListener('pointerover', wyvr_interact_init);
        el.addEventListener('interact', wyvr_interact_init);
        el.setAttribute('data-bind-interact', 'true');
    }
    if (trigger) {
        if (!window.wyvr) {
            window.wyvr = {};
        }
        window.wyvr[trigger] = () => {
            for (const el of elements) {
                wyvr_interact_init({ target: el, type: 'mouseover' });
            }
        };
    }
}

const wyvr_interact_init = (e) => {
    let el = e.target;
    let last_element;
    while (el && el.tagName !== 'HTML') {
        if (
            el.getAttribute('data-hydrate') &&
            el.getAttribute('data-loading') === 'interact'
        ) {
            last_element = el;
        }
        el = el.parentNode;
    }

    if (!last_element) {
        return;
    }
    const path = get_dom_path(e.target, last_element);
    wyvr_props(last_element).then((props) => {
        const target = wyvr_portal(last_element, props);
        const name = target.getAttribute('data-hydrate');
        if (
            name &&
            wyvr_interact_classes[name] &&
            !wyvr_interact_classes[name].loaded
        ) {
            wyvr_interact_classes[name].loaded = true;
            const script = document.createElement('script');
            script.setAttribute('src', wyvr_interact_classes[name].path);
            if (path) {
                script.onload = () => {
                    // restore original event
                    setTimeout(() => {
                        let repathed_el;
                        try {
                            repathed_el = document.querySelector(path);
                        } catch (e) {
                            console.log(e, path);
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
                };
            }
            document.body.appendChild(script);
            last_element.removeEventListener('mouseover', wyvr_interact_init);
            last_element.removeEventListener('mousedown', wyvr_interact_init);
            last_element.removeEventListener('focusin', wyvr_interact_init);
            last_element.removeEventListener('pointerover', wyvr_interact_init);
        }
    });
};

function get_dom_path(el, parent) {
    const stack = [];
    const id = `${parent.getAttribute(
        'data-hydrate-path'
    )}_${new Date().getTime()}`;
    // set the unique value only once
    if (parent.getAttribute('data-hydrate-id')) {
        return undefined;
    }
    parent.setAttribute('data-hydrate-id', id);
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
