import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_trigger } from '@wyvr/generator/src/resource/trigger.js';
import { wyvr_request_component } from '@wyvr/generator/src/resource/request_component.js';
import { wyvr_media } from '@wyvr/generator/src/resource/media.js';

export function wyvr_request_media(elements, name, request, trigger) {
    if (!elements) {
        return;
    }

    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = { request };
    }

    const targets = wyvr_portal_targets(elements);

    const { revoke } = wyvr_media(name, targets, (el) => {
        wyvr_request_component(el, request);
    });

    wyvr_trigger(trigger, targets, (el) => {
        wyvr_request_component(el, request);
        revoke();
    });
}
