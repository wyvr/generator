import { wyvr_portal_targets } from 'wyvr/src/resource/portal.js';
import { wyvr_request_component } from 'wyvr/src/resource/request_component.js';
import { wyvr_lazy_observer } from 'wyvr/src/resource/lazy.js';
import { wyvr_trigger } from 'wyvr/src/resource/trigger.js';
import { wyvr_load } from 'wyvr/src/resource/load.js';
import { wyvr_mark } from 'wyvr/src/resource/mark.js';

export function wyvr_hydrequest_idle(path, elements, name, request, trigger) {
    const targets = wyvr_mark(wyvr_portal_targets(elements));
    if (!targets) {
        return;
    }
    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = { path, request };
    }

    window.requestIdleCallback
        ? requestIdleCallback(() => {
              wyvr_request_idle_init(targets, request);
          })
        : wyvr_request_idle_init(targets, request);

    wyvr_trigger(trigger, targets, (el) => {
        wyvr_request_idle_exec(el, request);
    });
}

function wyvr_request_idle_init(elements, request) {
    wyvr_lazy_observer(elements, (el) => {
        wyvr_request_idle_exec(el, request);
    });
}
function wyvr_request_idle_exec(el, request) {
    wyvr_request_component(el, request, (el, content, json, attributes) => {
        wyvr_load(el);
    });
}
