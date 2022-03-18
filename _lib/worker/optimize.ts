import { Error } from '@lib/error';
import { File } from '@lib/file';
import { Logger } from '@lib/logger';
import { Optimize } from '@lib/optimize';
import { ReleasePath } from '@lib/vars/release_path';
import { extname } from 'path';
import critical from 'critical';
import { minify } from 'html-minifier';
import { IWorkerOptimizeValue } from '@lib/interface/worker';

export const optimize = async (value: IWorkerOptimizeValue) => {
    let css = null;
    try {
        // create above the fold inline css
        const result = await critical.generate({
            inline: false, // generates CSS
            base: ReleasePath.get(),
            src: value.path,
            dimensions: [
                { width: 320, height: 568 },
                { width: 360, height: 720 },
                { width: 480, height: 800 },
                { width: 1024, height: 768 },
                { width: 1280, height: 1024 },
                { width: 1920, height: 1080 },
            ],
        });
        css = result.css;
    } catch (e) {
        Logger.error(Error.get(e, value.files[0], 'worker optimize critical'));
    }
    if (!css) {
        css = '';
    }

    value.files.forEach((file) => {
        const css_tag = `<style id="critical-css">${css}</style>`;
        let content = File.read(file).replace(/<style data-critical-css><\/style>/, css_tag);
        // replace hashed files in the content
        content = Optimize.replace_hashed_files(content, value.hash_list);
        // minify the html output
        if (['.html', '.htm'].indexOf(extname(file)) > -1) {
            try {
                content = minify(content, {
                    collapseBooleanAttributes: true,
                    collapseInlineTagWhitespace: true,
                    collapseWhitespace: true,
                    continueOnParseError: true,
                    removeAttributeQuotes: true,
                    removeComments: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    useShortDoctype: true,
                });
            } catch (e) {
                Logger.error(Error.get(e, file, 'worker optimize minify'));
            }
        }

        File.write(file, content);
    });
};
