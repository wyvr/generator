/* App.svelte generated by Svelte v3.55.1 */
import { create_ssr_component, each, validate_component } from '[root]/gen/server/svelte_internal.mjs';

import Thing from './Thing.svelte';

const App = await create_ssr_component(async ($$result, $$props, $$bindings, slots) => { try {
	let things = [
		{ id: 1, name: 'apple' },
		{ id: 2, name: 'banana' },
		{ id: 3, name: 'carrot' },
		{ id: 4, name: 'doughnut' },
		{ id: 5, name: 'egg' }
	];

	function handleClick() {
		things = things.slice(1);
	}

	return `<button>Remove first thing
</button>

${await each(things, async thing => {
		return `${await validate_component(Thing, "Thing").$$render($$result, { name: thing.name }, {}, {})}`;
	})}`;
} catch(e) {throw e;}
});

export default App;