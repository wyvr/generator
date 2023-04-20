import { create_ssr_component } from 'svelte/internal';

import Component from './Default.js';

const Component = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	const data = {};

	return `${validate_component(Component, "Doc").$$render($$result, { data }, {}, {
		default: () => {
			return `${validate_component(Component, "Layout").$$render($$result, { data }, {}, {
				default: () => {
					return `${validate_component(Component, "Page").$$render($$result, { data }, {}, {
						default: ({ product }) => {
							return `<!-- HTML_TAG_START -->${data.content || ''}<!-- HTML_TAG_END -->`;
						}
					})}`;
				}
			})}`;
		}
	})}`;
});

export default Component;