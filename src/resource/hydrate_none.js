/* eslint-disable no-console */

import { wyvr_portal } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_props } from '@wyvr/generator/src/resource/props.js';

if(!window.wyvr_classes) {
    window.wyvr_classes = {};
}

export function wyvr_hydrate_none(path, elements, name, cls, trigger) {
    window.wyvr_classes[name] = { cls, path, loaded: false };
    if (!window.wyvr) {
        window.wyvr = {};
    }
    if (window.wyvr[trigger]) {
        return null;
    }
    window.wyvr[trigger] = () => {
        for (const el of elements) {
            wyvr_props(el).then((props) => {
                const target = wyvr_portal(el, props);
                const name = target.getAttribute('data-hydrate');
                if (name && !window.wyvr_classes[name].loaded) {
                    window.wyvr_classes[name].loaded = true;
                    const script = document.createElement('script');
                    script.setAttribute('src', window.wyvr_classes[name].path);
                    document.body.appendChild(script);
                }
            });
        }
    };
}
