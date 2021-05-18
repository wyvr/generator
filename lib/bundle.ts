const rollup = require('rollup');
const svelte = require('rollup-plugin-svelte');
const resolve = require('@rollup/plugin-node-resolve').default;

// @see https://github.com/sveltejs/rollup-plugin-svelte
const logger_options = {
    logger: {
        name: 'bundle',
        file: 'pub/bundle.js',
        format: 'iife',
    },
    plugins: [
        svelte({
            // You can restrict which files are compiled
            // using `include` and `exclude`
            // include: 'src/components/**/*.svelte',
            include: 'src/**/*.svelte',
            compilerOptions: {
                hydratable: true,
            },

            // Optionally, preprocess components with svelte.preprocess:
            // https://svelte.dev/docs#svelte_preprocess
            // preprocess: {
            //     style: ({ content }) => {
            //         return transformStyles(content);
            //     },
            // },
            // Emit CSS as "files" for other plugins to process. default is true
            emitCss: false,
            onwarn: (warning, handler) => {
                // e.g. don't warn on <marquee> elements, cos they're cool
                if (warning.code === 'a11y-distracting-elements') return;

                // let Rollup handle all other warnings normally
                handler(warning);
            },
        }),
        // see NOTICE below
        resolve({ browser: true }),
    ],
};

module.exports = {
    async build(filename) {
        if (!filename) {
            return null;
        }
        const options = Object.assign(
            {
                input: filename,
            },
            logger_options
        );
        // create a bundle
        let bundle = null;
        try {
            bundle = await rollup.rollup(options);
        } catch (e) {
            console.log(e);
        }
        if (!bundle) {
            return null;
        }

        // generate logger specific code in-memory
        // you can call this function multiple times on the same bundle object
        const { logger } = await bundle.generate(options);

        for (const chunkOrAsset of logger) {
            if (chunkOrAsset.type === 'asset') {
                // For assets, this contains
                // {
                //   fileName: string,              // the asset file name
                //   source: string | Uint8Array    // the asset source
                //   type: 'asset'                  // signifies that this is an asset
                // }
                console.log('Asset', chunkOrAsset);
            } else {
                // For chunks, this contains
                // {
                //   code: string,                  // the generated JS code
                //   dynamicImports: string[],      // external modules imported dynamically by the chunk
                //   exports: string[],             // exported variable names
                //   facadeModuleId: string | null, // the id of a module that this chunk corresponds to
                //   fileName: string,              // the chunk file name
                //   implicitlyLoadedBefore: string[]; // entries that should only be loaded after this chunk
                //   imports: string[],             // external modules imported statically by the chunk
                //   importedBindings: {[imported: string]: string[]} // imported bindings per dependency
                //   isDynamicEntry: boolean,       // is this chunk a dynamic entry point
                //   isEntry: boolean,              // is this chunk a static entry point
                //   isImplicitEntry: boolean,      // should this chunk only be loaded after other chunks
                //   map: string | null,            // sourcemaps if present
                //   modules: {                     // information about the modules in this chunk
                //     [id: string]: {
                //       renderedExports: string[]; // exported variable names that were included
                //       removedExports: string[];  // exported variable names that were removed
                //       renderedLength: number;    // the length of the remaining code in this module
                //       originalLength: number;    // the original length of the code in this module
                //     };
                //   },
                //   name: string                   // the name of this chunk as used in naming patterns
                //   referencedFiles: string[]      // files referenced via import.meta.ROLLUP_FILE_URL_<id>
                //   type: 'chunk',                 // signifies that this is a chunk
                // }
                console.log('Chunk', chunkOrAsset.modules);
            }
        }

        // or write the bundle to disk
        await bundle.write(options);

        // closes the bundle
        await bundle.close();
    },
};
