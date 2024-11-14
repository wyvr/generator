import { wyvr_portal_targets } from 'wyvr/src/resource/portal.js';
import { wyvr_lazy_observer } from 'wyvr/src/resource/lazy.js';
import { wyvr_trigger } from 'wyvr/src/resource/trigger.js';
import { wyvr_load } from 'wyvr/src/resource/load.js';
import { wyvr_mark } from 'wyvr/src/resource/mark.js';

export function wyvr_hydrate_idle(path, elements, name, trigger) {
    const targets = wyvr_mark(wyvr_portal_targets(elements));
    if (!targets) {
        return;
    }
    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = { path, loaded: false };
    }

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
