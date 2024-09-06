import { wyvr_props } from '@wyvr/generator/src/resource/props.js';

export async function wyvr_instant(el, Class) {
    const props = await wyvr_props(el);
    const slots = el.querySelectorAll('[data-slot]');

    el.innerHTML = '';
    new Class({
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
}
