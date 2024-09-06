/* eslint-disable no-console */
import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_trigger } from '@wyvr/generator/src/resource/trigger.js';
import { wyvr_request_component } from '@wyvr/generator/src/resource/request_component.js';
import { wyvr_interact } from '@wyvr/generator/src/resource/interact.js';
import { wyvr_load } from '@wyvr/generator/src/resource/load.js';

export function wyvr_hydrequest_interact(path, elements, name, request, trigger) {
    if (!elements) {
        return;
    }

    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = { path, request };
    }
    const targets = wyvr_portal_targets(elements);

    const { interact } = wyvr_interact(name, targets, (el, name, e) => {
        return new Promise((resolve) => {
            wyvr_request_component(el, window.wyvr_classes[name]?.request, (el, content, json, attributes) => {
                wyvr_load(el);
                resolve();
            });
        });
    });

    wyvr_trigger(trigger, targets, (el) => {
        interact(el);
    });
}
