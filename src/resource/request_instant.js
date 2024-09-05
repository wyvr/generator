import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_request_component } from '@wyvr/generator/src/resource/request_component.js';

export function wyvr_request_instant(elements, name, request) {
    if (!elements) {
        return;
    }
    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = { request };
    }
    for (const el of wyvr_portal_targets(elements)) {
        wyvr_request_component(el, request);
    }
}
