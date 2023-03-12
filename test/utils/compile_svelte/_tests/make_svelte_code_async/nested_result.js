import { create_ssr_component } from '[root]/gen/server/svelte_internal.mjs';

import Component from './Default.js';

const Component = await create_ssr_component(async ($$result, $$props, $$bindings, slots) => { try {
	const data = {};

	return `${await validate_component(Component, "Doc").$$render($$result, { data }, {}, {
		default: async () => {
			return `${await validate_component(Component, "Layout").$$render($$result, { data }, {}, {
				default: async () => {
					return `${await validate_component(Component, "Page").$$render($$result, { data }, {}, {
						default: async () => {
							return `<!-- HTML_TAG_START -->${data.content || ''}<!-- HTML_TAG_END -->`;
						}
					})}`;
				}
			})}`;
		}
	})}`;
} catch(e) {console.log(import.meta.url, e); return '';}
});

export default Component;