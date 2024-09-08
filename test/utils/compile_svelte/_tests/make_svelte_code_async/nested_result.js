import { create_ssr_component } from '[root]/gen/svelte/src/runtime/internal/index.js';

import Component from './Default.js';

const Component = await create_ssr_component(async ($$result, $$props, $$bindings, slots) => { try {
	const data = {};

	return `${await validate_component(Component, "Doc").$$render($$result, { data }, {}, {
		default: async () => {
			return `${await validate_component(Component, "Layout").$$render($$result, { data }, {}, {
				default: async () => {
					return `${await validate_component(Component, "Page").$$render($$result, { data }, {}, {
						default: async ({ product }) => {
							return `<!-- HTML_TAG_START -->${data.content || ''}<!-- HTML_TAG_END -->`;
						}
					})}`;
				}
			})}`;
		}
	})}`;
} catch(e) {throw e;}
});

export default Component;