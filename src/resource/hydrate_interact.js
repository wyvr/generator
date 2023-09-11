/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const wyvr_interact_classes = {};

const wyvr_hydrate_interact = (path, elements, name, cls, trigger) => {
    wyvr_interact_classes[name] = { cls, path, loaded: false };

    Array.from(elements).forEach((el) => {
        el.addEventListener('mouseover', wyvr_interact_init);
        el.addEventListener('mousedown', wyvr_interact_init);
        el.addEventListener('focusin', wyvr_interact_init);
        el.addEventListener('pointerover', wyvr_interact_init);
        el.addEventListener('interact', wyvr_interact_init);
        el.setAttribute('data-bind-interact', 'true');
    });
    if (trigger) {
        if (!window.wyvr) {
            window.wyvr = {};
        }
        window.wyvr[trigger] = () => {
            Array.from(elements).forEach((el) => {
                wyvr_interact_init({ target: el, type: 'mouseover' });
            });
        };
    }
};

const wyvr_interact_init = (e) => {
    let el = e.target;
    let last_element;
    while (el && el.tagName != 'HTML') {
        if (el.getAttribute('data-hydrate') && el.getAttribute('data-loading') == 'interact') {
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
        if (name && wyvr_interact_classes[name] && !wyvr_interact_classes[name].loaded) {
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
                            if (event_name == 'focusin') {
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
    var stack = [];
    const id = parent.getAttribute('data-hydrate-path') + '_' + new Date().getTime();
    // set the unique value only once
    if (parent.getAttribute('data-hydrate-id')) {
        return undefined;
    }
    parent.setAttribute('data-hydrate-id', id);
    while (el != parent && el != undefined) {
        var sibCount = 1;
        var sibIndex = 0;
        for (var i = 0; i < el.parentNode.childNodes.length; i++) {
            var sib = el.parentNode.childNodes[i];
            if (sib.nodeName == el.nodeName) {
                if (sib === el) {
                    sibIndex = sibCount;
                    break;
                }
                sibCount++;
            }
        }
        if (!el.getAttribute('data-hydrate')) {
            if (el.hasAttribute('id') && el.id != '') {
                stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
            } else if (sibCount > 1) {
                stack.unshift(el.nodeName.toLowerCase() + ':nth-child(' + sibIndex + ')');
            } else {
                stack.unshift(el.nodeName.toLowerCase());
            }
        }
        el = el.parentNode;
    }
    stack.unshift(`[data-hydrate-id="${id}"]`); // add it with the id as root
    return stack.join('>');
}
