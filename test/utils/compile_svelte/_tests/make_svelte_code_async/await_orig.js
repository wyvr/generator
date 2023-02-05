import { create_ssr_component, escape, is_promise, noop } from "svelte/internal";

async function getRandomNumber() {
	const res = await fetch(`/tutorial/random-number`);
	const text = await res.text();

	if (res.ok) {
		return text;
	} else {
		throw new Error(text);
	}
}

const App = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	let promise = getRandomNumber();

	function handleClick() {
		promise = getRandomNumber();
	}

	return `<button>generate random number
</button>

${(function (__value) {
		if (is_promise(__value)) {
			__value.then(null, noop);

			return `
	<p>...waiting</p>
`;
		}

		return (function (number) {
			return `
	<p>The number is ${escape(number)}</p>
`;
		})(__value);
	})(promise)}`;
});

export default App;