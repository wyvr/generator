/* App.svelte generated by Svelte v3.55.1 */
import { create_ssr_component, each, escape } from '[root]/gen/svelte/src/runtime/internal/index.js';

const App = await create_ssr_component(async ($$result, $$props, $$bindings, slots) => { try {
	let cats = [
		{ id: 'J---aiyznGQ', name: 'Keyboard Cat' },
		{ id: 'z_AbfPXTKms', name: 'Maru' },
		{
			id: 'OUtn3pvWmpg',
			name: 'Henri The Existential Cat'
		}
	];

	return `<h1>The Famous Cats of YouTube</h1>

<ul>${await each(cats, async ({ id, name }, i) => {
		return `<li><a target="${"_blank"}" href="${"https://www.youtube.com/watch?v=" + escape(id, true)}" rel="${"noreferrer"}">${escape(i + 1)}: ${escape(name)}
		</a></li>`;
	})}</ul>`;
} catch(e) {throw e;}
});

export default App;