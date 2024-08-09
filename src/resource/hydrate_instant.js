import { wyvr_portal } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_props } from '@wyvr/generator/src/resource/props.js';

export function wyvr_hydrate_instant(elements, cls) {
    if (!elements) {
        return;
    }
    for (const el of elements) {
        wyvr_props(el).then((props) => {
            const target = wyvr_portal(el, props);
            const slots = el.querySelectorAll('[data-slot]');

            target.innerHTML = '';
            new cls({
                target,
                props
            });
            if (slots) {
                Array.from(slots).map((slot) => {
                    const slot_name = slot.getAttribute('data-slot');
                    const client_slot = target.querySelector(`[data-client-slot="${slot_name}"]`);
                    if (client_slot) {
                        client_slot.parentNode.insertBefore(slot, client_slot);
                        client_slot.remove();
                    }
                });
            }
            target.setAttribute('data-hydrated', 'true');
        });
    }
}
