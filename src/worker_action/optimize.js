import { filled_array } from '../utils/validate.js';
import { minify } from 'html-minifier';
import { read, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { extname } from 'path';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { get_error_message } from '../utils/error.js';

export async function optimize(files) {
    if (!filled_array(files)) {
        return false;
    }
    for (const file of files) {
        let content = read(file);
        switch (extname(file)) {
            case '.html':
            case '.htm': {
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
                    Logger.error(get_error_message(e, file, 'minify'));
                }
                break;
            }
            case '.css': {
                try {
                    const result = await postcss([cssnano({ plugins: [autoprefixer] })]).process(content, {
                        from: undefined,
                    });
                    content = result.css;
                } catch (e) {
                    Logger.error(get_error_message(e, file, 'css'));
                }
                break;
            }
        }

        write(file, content);
    }
    return true;
}
