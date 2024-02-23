/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

import { wyvr_portal } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_props } from '@wyvr/generator/src/resource/props.js';

const wyvr_lazy_classes = {};

export function wyvr_hydrate_lazy(path, elements, name, cls, trigger) {
    wyvr_lazy_classes[name] = { cls, path, loaded: false };

    for (const el of elements) {
        wyvr_props(el).then((props) => {
            const target = wyvr_portal(el, props);
            wyvr_lazy_observer.observe(target);
        });
    }
    if (trigger) {
        if (!window.wyvr) {
            window.wyvr = {};
        }
        window.wyvr[trigger] = () => {
            for (const el of elements) {
                wyvr_lazy_init(el);
            }
        };
    }
}

const wyvr_lazy_observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            wyvr_lazy_init(entry.target);
            wyvr_lazy_observer.unobserve(entry.target);
        }
    }
});

function wyvr_lazy_init(element) {
    const name = element.getAttribute('data-hydrate');
    if (name && !wyvr_lazy_classes[name].loaded) {
        wyvr_lazy_classes[name].loaded = true;
        const script = document.createElement('script');
        script.setAttribute('src', `${wyvr_lazy_classes[name].path}?bid=${window.build_id}`);
        document.body.appendChild(script);
    }
}
