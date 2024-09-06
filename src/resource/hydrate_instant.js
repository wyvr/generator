import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_instant } from '@wyvr/generator/src/resource/instant.js';

export function wyvr_hydrate_instant(elements, Class, name) {
    if (!elements) {
        return;
    }
    const targets = wyvr_portal_targets(elements);

    for (const el of targets) {
        wyvr_instant(el, Class);
    }
}
