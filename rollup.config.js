import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-css-only';
import path from 'path';

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
        alias({
            entries: [{ find: '@src', replacement: path.resolve('src') }],
        }),
        svelte({
            // Tell the svelte plugin where our svelte files are located
            include: ['gen/js/**/*.svelte', 'src/**/*.svelte'],
            emitCss: false,
            compilerOptions: {
                // By default, the client-side compiler is used. You
                // can also use the server-side rendering compiler
                generate: 'dom',

                // ensure that extra attributes are added to head
                // elements for hydration (used with generate: 'ssr')
                hydratable: true,
                immutable: true,
                format: 'esm',
                cssHash: ({hash, css})=>{
                    return `ru-${hash(css)}`;
                }

            },
        }),
        resolve({ browser: true }),
        commonjs(),
        css({ output: 'gen/default.css' }),
        // Tell any third-party plugins that we're building for the browser
    ],
};
