/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const wyvr_interact_classes = {};

const wyvr_hydrate_interact = (path, elements, name, cls) => {
    wyvr_interact_classes[name] = { cls, path, loaded: false };

    Array.from(elements).forEach((el) => {
        el.addEventListener('mouseover', wyvr_interact_init);
        el.addEventListener('mousedown', wyvr_interact_init);
        el.addEventListener('focusin', wyvr_interact_init);
        el.addEventListener('pointerover', wyvr_interact_init);
    });
};

const wyvr_interact_init = (e) => {
    let el = e.target;
    while (!el.getAttribute('data-hydrate') || el.tagName == 'HTML') {
        el = el.parentNode;
    }
    const path = get_dom_path(e.target, el).join('>');
    if (el.tagName == 'HTML') {
        return;
    }

    wyvr_props(el).then((props) => {
        const target = wyvr_portal(el, props);
        const name = target.getAttribute('data-hydrate');
        if (name && wyvr_interact_classes[name] && !wyvr_interact_classes[name].loaded) {
            wyvr_interact_classes[name].loaded = true;
            const script = document.createElement('script');
            script.setAttribute('src', wyvr_interact_classes[name].path);
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
            document.body.appendChild(script);
            el.removeEventListener('mouseover', wyvr_interact_init);
            el.removeEventListener('mousedown', wyvr_interact_init);
            el.removeEventListener('focusin', wyvr_interact_init);
            el.removeEventListener('pointerover', wyvr_interact_init);
        }
    });
};

function get_dom_path(el, parent) {
    var stack = [];
    const id = parent.getAttribute('data-hydrate-path') + '_' + new Date().getTime();
    parent.setAttribute('data-hydrate-id', id);
    while (el != parent && el != undefined) {
        var sibCount = 0;
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
        if (el.hasAttribute('id') && el.id != '') {
            stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
        } else if (sibCount > 1) {
            stack.unshift(el.nodeName.toLowerCase() + ':eq(' + sibIndex + ')');
        } else {
            stack.unshift(el.nodeName.toLowerCase());
        }
        el = el.parentNode;
    }
    stack.unshift(`[data-hydrate-id="${id}"]`); // add it with the id as root
    return stack;
}
