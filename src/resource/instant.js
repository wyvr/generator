import { wyvr_props } from '@wyvr/generator/src/resource/props.js';

export async function wyvr_instant(el, Class) {
    const name = el.getAttribute('data-hydrate');
    if (window.wyvr_classes[name]) {
        window.wyvr_classes[name].cls = Class;
    }
    let props = await wyvr_props(el);
    const slots = el.querySelectorAll('[data-slot]');

    if (slots) {
        if (!props) {
            props = {};
        }
        props.$$slots = createSlots(slots);
        props.$$scope = {};
    }

    el.innerHTML = '';
    new Class({
        target: el,
        props
    });
    el.setAttribute('data-hydrated', 'true');
    el.setAttribute('data-wyvr', 'done');
}

export function createSlots(slots) {
    const svelteSlots = {};

    for (const slot of slots) {
        const name = slot.getAttribute('data-slot');
        svelteSlots[name] = [createSlotFn(slot)];
    }
    function noop() {}

    function createSlotFn(ele) {
        if (typeof ele === 'function') {
            const component = new ele({});
            return () => ({
                c() {
                    create_component(component.$$.fragment);
                    component.$set({}); // update props from the
                },
                m(target, anchor) {
                    mount_component(component, target, anchor, null);
                },
                d(detaching) {
                    destroy_component(component, detaching);
                },
                l: noop
            });
        }

        return () => ({
            c: noop,
            m: function mount(target, anchor) {
                target.insertBefore(ele, anchor || null);
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach(ele);
                }
            },
            l: noop
        });
    }
    return svelteSlots;
}
