import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_trigger } from '@wyvr/generator/src/resource/trigger.js';
import { wyvr_load } from '@wyvr/generator/src/resource/load.js';
import { wyvr_mark } from '@wyvr/generator/src/resource/mark.js';

export function wyvr_hydrate_none(path, elements, name, trigger) {
    const targets = wyvr_mark(wyvr_portal_targets(elements));
    if (!targets) {
        return;
    }

    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = { path, loaded: false };
    }

    wyvr_trigger(trigger, targets, (el) => {
        wyvr_load(el);
    });
}
