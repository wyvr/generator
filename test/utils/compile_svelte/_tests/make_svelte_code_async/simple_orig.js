import { create_ssr_component } from 'svelte/internal';

const Component = create_ssr_component(($$result, $$props, $$bindings, slots) => {
    let { data = null } = $$props;
    if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
    return `${slots.default ? slots.default({}) : ``}${slots.named ? slots.named({}) : ``}`;
});

export default Component;
