/* App.svelte generated by Svelte v3.50.0 */
import { create_ssr_component } from "svelte/internal";

const css = {
	code: ".green.svelte-57clml{color:green}.red.svelte-57clml{color:red}",
	map: "{\"version\":3,\"file\":\"App.svelte\",\"sources\":[\"App.svelte\"],\"sourcesContent\":[\"<script>\\n\\texport let a = false;\\n</script>\\n\\n{#if a}\\n<span class=\\\"green\\\">some awesome</span>\\n{:else}\\n<span class=\\\"red\\\">missing</span>\\n{/if}\\n\\n<style>\\n\\t.green {\\n\\t\\tcolor:green;\\n\\t}\\n\\t.red {\\n\\t\\tcolor:red;\\n\\t}\\n</style>\"],\"names\":[],\"mappings\":\"AAWC,MAAM,cAAC,CAAC,AACP,MAAM,KAAK,AACZ,CAAC,AACD,IAAI,cAAC,CAAC,AACL,MAAM,GAAG,AACV,CAAC\"}"
};

const App = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	let { a = false } = $$props;
	if ($$props.a === void 0 && $$bindings.a && a !== void 0) $$bindings.a(a);
	$$result.css.add(css);

	return `${a
	? `<span class="${"green svelte-57clml"}">awesome</span>`
	: `<span class="${"red svelte-57clml"}">missing</span>`}`;
});

export default App;