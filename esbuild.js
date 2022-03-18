import esbuild from 'esbuild';
// import { resolve, join, dirname } from 'path';
import { join } from 'path';
import { readdirSync, lstatSync } from 'fs';
import { hrtime } from 'process';
// import { fileURLToPath } from 'url';
// import GlobalsPlugin from 'esbuild-plugin-globals';

// const __dirname = dirname(fileURLToPath(import.meta.url));

function getFiles(folder) {
    const result = [];
    readdirSync(folder).forEach((file) => {
        const item_path = join(folder, file);
        if (file.match(/\.ts$/)) {
            result.push(item_path);
            return;
        }
        if (lstatSync(item_path).isDirectory()) {
            result.push(...getFiles(item_path));
        }
    });

    return result;
}

(async () => {
    const start = hrtime.bigint();
    const entryPoints = getFiles('src');
    const results = {};
    await Promise.all(
        entryPoints.map(async (entryPoint) => {
            results[entryPoint] = await esbuild.build({
                entryPoints: [entryPoint],
                outfile: entryPoint.replace(/\.ts$/, '.js').replace(/^src\//, 'lib/'),
                sourcemap: true,
                minify: true,
                format: 'esm',
                bundle: true,
                platform: 'node',
                target: ['node16'],
                // plugins: [
                //     GlobalsPlugin({
                //         '@lib/.*': (moduleName)=> {console.log(moduleName);return resolve(__dirname, './src/', moduleName)},
                //     }),
                // ],
            });
        })
    );
    const ms = Math.round(Number(hrtime.bigint() - start) / 1000000);
    console.log(`esbuild: ${Object.keys(results).length} files built in ${ms} ms`);
    // console.log(results);
})();
