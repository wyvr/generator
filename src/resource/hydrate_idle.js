import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_lazy_observer } from '@wyvr/generator/src/resource/lazy.js';
import { wyvr_trigger } from '@wyvr/generator/src/resource/trigger.js';
import { wyvr_load } from '@wyvr/generator/src/resource/load.js';

export function wyvr_hydrate_idle(path, elements, name, trigger) {
    if (!elements) {
        return;
    }
    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = { path, loaded: false };
    }
    const targets = wyvr_portal_targets(elements);

    window.requestIdleCallback
        ? requestIdleCallback(() => {
              wyvr_idle_init(targets);
          })
        : wyvr_idle_init(targets);

    wyvr_trigger(trigger, targets, (el) => {
        wyvr_load(el);
    });
}

function wyvr_idle_init(elements) {
    wyvr_lazy_observer(elements, (el) => {
        wyvr_load(el);
    });
}
