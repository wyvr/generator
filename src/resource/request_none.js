import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_trigger } from '@wyvr/generator/src/resource/trigger.js';
import { wyvr_request_component } from '@wyvr/generator/src/resource/request_component.js';
import { wyvr_mark } from '@wyvr/generator/src/resource/mark.js';

export function wyvr_request_none(elements, name, request, trigger) {
    const targets = wyvr_mark(wyvr_portal_targets(elements));
    if (!targets) {
        return;
    }
    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = { request };
    }

    wyvr_trigger(trigger, targets, (el) => {
        wyvr_request_component(el, request);
    });
}
