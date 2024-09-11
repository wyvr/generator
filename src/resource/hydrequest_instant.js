import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_request_component } from '@wyvr/generator/src/resource/request_component.js';
import { wyvr_instant } from '@wyvr/generator/src/resource/instant.js';
import { wyvr_mark } from '@wyvr/generator/src/resource/mark.js';
import { wyvr_class } from '@wyvr/generator/src/resource/class.js';

export function wyvr_hydrequest_instant(elements, Class, name, request, trigger) {
    if (name && Class) {
        wyvr_class(Class, name);
    }
    const targets = wyvr_mark(wyvr_portal_targets(elements));
    if (!targets) {
        return;
    }
    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = { cls: Class, request };
    }
    for (const el of targets) {
        wyvr_request_component(el, request, (el, content, json, attributes) => {
            wyvr_instant(el, Class);
        });
    }
}
