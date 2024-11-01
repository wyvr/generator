import { wyvr_portal_targets } from 'wyvr/src/resource/portal.js';
import { wyvr_trigger } from 'wyvr/src/resource/trigger.js';
import { wyvr_request_component } from 'wyvr/src/resource/request_component.js';
import { wyvr_interact } from 'wyvr/src/resource/interact.js';
import { wyvr_mark } from 'wyvr/src/resource/mark.js';

export function wyvr_request_interact(elements, name, request, trigger) {
    const targets = wyvr_mark(wyvr_portal_targets(elements));
    if (!targets) {
        return;
    }

    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = { request };
    }

    const { interact } = wyvr_interact(name, targets, (el, name, e) => {
        return new Promise((resolve) => {
            wyvr_request_component(el, window.wyvr_classes[name]?.request, (el, content, json, attributes) => {
                resolve();
            });
        });
    });

    wyvr_trigger(trigger, targets, (el) => {
        interact(el);
    });
}
