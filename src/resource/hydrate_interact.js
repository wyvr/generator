import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_trigger } from '@wyvr/generator/src/resource/trigger.js';
import { wyvr_load } from '@wyvr/generator/src/resource/load.js';
import { wyvr_interact } from '@wyvr/generator/src/resource/interact.js';
import { wyvr_mark } from '@wyvr/generator/src/resource/mark.js';

export function wyvr_hydrate_interact(path, elements, name, trigger) {
    const targets = wyvr_mark(wyvr_portal_targets(elements));
    if (!targets) {
        return;
    }

    window.wyvr_classes[name] = { path, loaded: false };

    const { interact } = wyvr_interact(name, targets, (el, name, e) => {
        return new Promise((resolve) => {
            wyvr_load(el, (script, name, el) => {
                resolve();
            });
        });
    });

    wyvr_trigger(trigger, targets, (el) => {
        interact(el);
    });
}
