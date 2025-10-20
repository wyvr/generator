import { wyvr_portal_targets } from 'wyvr/src/resource/portal.js';
import { wyvr_instant } from 'wyvr/src/resource/instant.js';

export function wyvr_hydrate_instant(elements, Class, name) {
    const targets = wyvr_portal_targets(elements);
    if (!targets) {
        return;
    }

    for (const el of targets) {
        wyvr_instant(el, Class);
    }
}
