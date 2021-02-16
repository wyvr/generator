const build = require('./lib/build.js');

const component = build.compile('./src/App.svelte');
console.log('component', component)

const rendered = build.render(component, { name: 'P@', details: true });
console.log('rendered', rendered)