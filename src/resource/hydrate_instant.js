/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
function wyvr_hydrate_instant(elements, cls) {
    if (!elements) {
        return;
    }
    Array.from(elements).forEach((el) => {
        wyvr_props(el).then((props) => {
            const target = wyvr_portal(el, props);
            const slots = el.querySelectorAll('[data-slot]');

            target.innerHTML = '';
            new cls({
                target,
                props: props,
            });
            if (slots) {
                Array.from(slots).map((slot) => {
                    const slot_name = slot.getAttribute('data-slot');
                    const client_slot = target.querySelector('[data-client-slot="' + slot_name + '"]');
                    if (client_slot) {
                        client_slot.parentNode.insertBefore(slot, client_slot);
                        client_slot.remove();
                    }
                });
            }
            target.setAttribute('data-hydrated', 'true');
        });
    });
}