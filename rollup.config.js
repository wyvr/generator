import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';

export default {
    // This `main.js` file we wrote
    input: 'gen/js/default.js',
    output: {
        // The destination for our bundled JavaScript
        file: 'gen/default.js',
        // Our bundle will be an Immediately-Invoked Function Expression
        format: 'iife',
        // The IIFE return value will be assigned into a variable called `app`
        name: 'app',
    },
    plugins: [
        svelte({
            // Tell the svelte plugin where our svelte files are located
            include: ['gen/js/**/*.svelte', 'src/**/*.svelte'],
        }),
        alias({
            entries: [{ find: '@src', replacement: 'src' }],
        }),
        resolve({ browser: true }),
        // Tell any third-party plugins that we're building for the browser
    ],
};
