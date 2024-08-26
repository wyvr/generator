import { create_ssr_component, escape, is_promise, noop } from '[root]/gen/server/svelte_internal.mjs';

async function getRandomNumber() {
	const res = await fetch(`/tutorial/random-number`);
	const text = await res.text();

	if (res.ok) {
		return text;
	} else {
		throw new Error(text);
	}
}

const App = await create_ssr_component(async ($$result, $$props, $$bindings, slots) => { try {
	let promise = getRandomNumber();

	function handleClick() {
		promise = getRandomNumber();
	}

	return `<button>generate random number
</button>

${await (async function (__value) {
		try {__value = await __value;} catch(e) {__value = undefined}; if (is_promise(__value)) {
			__value.then(null, noop);

			return `
	<p>...waiting</p>
`;
		}

		return await (async function (number) {
			return `
	<p>The number is ${escape(number)}</p>
`;
		})(__value);
	})(promise)}`;
} catch(e) {throw e;}
});

export default App;