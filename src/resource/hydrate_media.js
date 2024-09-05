import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_trigger } from '@wyvr/generator/src/resource/trigger.js';
import { wyvr_load } from '@wyvr/generator/src/resource/load.js';
import { wyvr_media } from '@wyvr/generator/src/resource/media.js';

export function wyvr_hydrate_media(path, elements, name, cls, trigger) {
    if (!elements) {
        return;
    }

    window.wyvr_classes[name] = { cls, path, loaded: false, elements };

    const targets = wyvr_portal_targets(elements);

    const { revoke } = wyvr_media(name, targets, (el) => {
        wyvr_load(el);
    });

    wyvr_trigger(trigger, targets, (el) => {
        wyvr_load(el);
        revoke();
    });
}
