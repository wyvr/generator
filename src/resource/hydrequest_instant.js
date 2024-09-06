import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_request_component } from '@wyvr/generator/src/resource/request_component.js';
import { wyvr_instant } from '@wyvr/generator/src/resource/instant.js';

export function wyvr_hydrequest_instant(elements, Class, name, request, trigger) {
    if (!elements) {
        return;
    }
    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = { Class, request };
    }
    for (const el of wyvr_portal_targets(elements)) {
        wyvr_request_component(el, request, (el, content, json, attributes) => {
            wyvr_instant(el, Class);
        });
    }
}
