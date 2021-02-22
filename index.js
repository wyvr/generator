const hr_start = process.hrtime()

const build = require('./lib/build.js');

const component = build.compile('./src/App.svelte');
// console.log('component', component)

const rendered = build.render(component, { name: 'P@', details: true });
console.log('rendered');
console.log(rendered.result.html)
console.log(rendered.hydrate)

var hr_end = process.hrtime(hr_start); // hr_end[0] is in seconds, hr_end[1] is in nanoseconds
const timeInMs = (hr_end[0]* 1000000000 + hr_end[1]) / 1000000; // convert first to ns then to ms
console.log('execution time', timeInMs, 'ms');