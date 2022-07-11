import { filled_array } from '../utils/validate.js';
import { minify } from 'html-minifier';
import { read, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { extname, join } from 'path';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { get_error_message } from '../utils/error.js';
import { to_relative_path } from '../utils/to.js';
import { ReleasePath } from '../vars/release_path.js';

export async function optimize(files) {
    if (!filled_array(files)) {
        return false;
    }
    const hash_keys = Object.keys(global.cache.hashes);
    for (const file of files) {
        let content = read(file);
        hash_keys.forEach((key) => {
            if (content.indexOf(key)) {
                content = content.replace(new RegExp(key, 'g'), global.cache.hashes[key].path);
            }
        });
        switch (extname(file)) {
            case '.html':
            case '.htm': {
                try {
                    const minified_content = minify(content, {
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

                    write(file, minified_content);
                } catch (e) {
                    Logger.error(get_error_message(e, file, 'minify'));
                }
                break;
            }
            case '.css': {
                try {
                    const file_hash = global.cache.hashes[to_relative_path(file)];
                    if (!file_hash) {
                        break;
                    }
                    const result = await postcss([cssnano({ plugins: [autoprefixer] })]).process(content, {
                        from: undefined,
                    });
                    write(join(ReleasePath.get(), file_hash.path), result.css);
                } catch (e) {
                    Logger.error(get_error_message(e, file, 'css'));
                }
                break;
            }
            case '.cjs':
            case '.mjs':
            case '.js': {
                const file_hash = global.cache.hashes[to_relative_path(file)];
                if (!file_hash) {
                    break;
                }
                write(join(ReleasePath.get(), file_hash.path), content);
                break;
            }
        }
    }
    return true;
}
