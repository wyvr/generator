import { create_ssr_component } from '[root]/gen/svelte/src/runtime/internal/index.js';

const Component = await create_ssr_component(async ($$result, $$props, $$bindings, slots) => { try {
    let { data = null } = $$props;
    if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
    return `${slots.default ? await slots.default({}) : ``}${slots.named ? await slots.named({}) : ``}`;
} catch(e) {throw e;}
});

export default Component;
