/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
function wyvr_hydrate_instant(elements, cls) {
    if (!elements) {
        return;
    }
    Array.from(elements).forEach((el) => {
        wyvr_props(el).then((props) => {
            const target = wyvr_portal(el, props);
            const slots = el.querySelectorAll('[data-slot]');

            target.innerHTML = '';
            const cmp = new cls({
                target,
                props: props,
            });
            if (slots) {
                Array.from(slots).map((slot) => {
                    const slot_name = slot.getAttribute('data-slot');
                    const client_slot = target.querySelector('[data-client-slot="' + slot_name + '"]');
                    if (client_slot) {
                        client_slot.parentNode.insertBefore(slot, client_slot);
                        client_slot.remove();
                    }
                });
            }
            target.setAttribute('data-hydrated', 'true');
            //console.log(cmp, cls)
        });
    });
}

/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const wyvr_props = (el) => {
    /* eslint-ensable no-unused-vars */
    return new Promise((resolve) => {
        let props = {};
        const json = '{' + el.getAttribute('data-props').replace(/\|/g, '"').replace(/§"§/g, '|') + '}';
        try {
            props = JSON.parse(json);
        } catch (e) {
            console.warn(json, e);
            resolve(props);
            return;
        }

        const load_props = Object.keys(props)
            .map((prop) => {
                const value = props[prop];
                if (typeof value != 'string') {
                    return undefined;
                }
                const match = value.match(/^@\(([^)]+)\)$/);
                if (Array.isArray(match) && match.length == 2) {
                    return { prop, url: match[1] };
                }

                return undefined;
            })
            .filter((x) => x);

        // nothing to load, end here
        if (load_props.length == 0) {
            resolve(props);
            return;
        }
        const loaded = [];
        const len = load_props.length;
        // check function
        const final = (success) => {
            loaded.push(success);
            if (loaded.length == len) {
                resolve(props);
            }
        };
        // load the "hugh" props
        load_props.forEach((load_prop) => {
            fetch(load_prop.url)
                .then((val) => val.json())
                .then((json) => {
                    props[load_prop.prop] = json;
                    final(true);
                })
                .catch((e) => {
                    console.warn(load_prop, e);
                    final(false);
                });
        });
    });
};

/* eslint-disable no-unused-vars */
const wyvr_portal = (el, props) => {
    /* eslint-enable no-unused-vars */
    const portal_prop = el.getAttribute('data-portal');
    if (portal_prop) {
        const portal_target_selector = props[portal_prop];
        if (portal_target_selector) {
            const portal_target = document.querySelector(portal_target_selector);
            if (portal_target) {
                Array.from(el.attributes).forEach((attr) => {
                    if (attr.name != 'data-portal') {
                        portal_target.setAttribute(attr.name, attr.value);
                    }
                });
                portal_target.innerHTML = el.innerHTML;
                el.remove();

                return portal_target;
            }
        }
    }
    return el;
};

import { I18N } from '[root]/src/model/i18n.js';

window._i18n = new I18N({});

window.__ = (key, options) => {
    const error = window._i18n.get_error(key, options);
    if (error) {
        console.warn('i18n', error);
    }
    return window._i18n.tr(key, options);
};

import file from '[cwd]/gen/client/Nonexisting.svelte';
const file_target = document.querySelectorAll('[data-hydrate="nonexisting"]');
wyvr_hydrate_instant(file_target, file);
