import { wyvr_portal_targets } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_props } from '@wyvr/generator/src/resource/props.js';

export function wyvr_hydrate_instant(elements, cls) {
    if (!elements) {
        return;
    }
    const targets = wyvr_portal_targets(elements);

    for (const el of targets) {
        wyvr_props(el).then((props) => {
            const slots = el.querySelectorAll('[data-slot]');

            el.innerHTML = '';
            new cls({
                target: el,
                props
            });
            if (slots) {
                Array.from(slots).map((slot) => {
                    const slot_name = slot.getAttribute('data-slot');
                    const client_slot = el.querySelector(`[data-client-slot="${slot_name}"]`);
                    if (client_slot) {
                        client_slot.parentNode.insertBefore(slot, client_slot);
                        client_slot.remove();
                    }
                });
            }
            el.setAttribute('data-hydrated', 'true');
        });
    }
}
