import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_request_component } from '@wyvr/generator/src/resource/request_component.js';
import { wyvr_lazy_observer } from '@wyvr/generator/src/resource/lazy.js';
import { wyvr_trigger } from '@wyvr/generator/src/resource/trigger.js';

export function wyvr_request_idle(elements, name, request, trigger) {
    if (!elements) {
        return;
    }
    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = { request };
    }
    const targets = wyvr_portal_targets(elements);

    window.requestIdleCallback
        ? requestIdleCallback(() => {
              wyvr_request_idle_init(targets, request);
          })
        : wyvr_request_idle_init(targets, request);

    wyvr_trigger(trigger, targets, (el) => {
        wyvr_request_component(el, request);
    });
}

function wyvr_request_idle_init(elements, request) {
    wyvr_lazy_observer(elements, (el) => {
        wyvr_request_component(el, request);
    });
}
