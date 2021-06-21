const wyvr_hydrate = (elements, cls) => {
    if (!elements) {
        return null;
    }
    return Array.from(elements).map((el) => {
        let props = {};
        const json = '{' + el.getAttribute('data-props').replace(/'/g, '"') + '}';
        const slots = el.querySelectorAll('[data-slot]');
        try {
            props = JSON.parse(json);
        } catch (e) {
            console.warn(json, e);
        }
        el.innerHTML = '';
        new cls({
            target: el,
            props: props,
        });
        if (slots) {
            Array.from(slots).map((slot) => {
                const slot_name = slot.getAttribute('data-slot');
                const client_slot = el.querySelector('[data-client-slot="' + slot_name + '"]');
                if (client_slot) {
                    client_slot.parentNode.insertBefore(slot, client_slot);
                    client_slot.remove();
                }
            });
        }
        el.setAttribute('data-hydrated', 'true');
        return el;
    });
};
