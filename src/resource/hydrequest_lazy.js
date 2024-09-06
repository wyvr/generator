import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_request_component } from '@wyvr/generator/src/resource/request_component.js';
import { wyvr_lazy_observer } from '@wyvr/generator/src/resource/lazy.js';
import { wyvr_trigger } from '@wyvr/generator/src/resource/trigger.js';
import { wyvr_load } from '@wyvr/generator/src/resource/load.js';

export function wyvr_hydrequest_lazy(path, elements, name, request, trigger) {
    if (!elements) {
        return;
    }
    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = { path, request };
    }
    const targets = wyvr_portal_targets(elements);

    wyvr_lazy_observer(targets, (el) => {
        wyvr_request_component(el, request, (el, content, json, attributes) => {
            wyvr_load(el);
        });
    });
    wyvr_trigger(trigger, targets, (el) => {
        wyvr_request_component(el, request, (el, content, json, attributes) => {
            wyvr_load(el);
        });
    });
}
