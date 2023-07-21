import { basename, dirname, extname } from 'path';
import { FOLDER_GEN_DATA, FOLDER_GEN_PAGES, FOLDER_GEN_SRC, FOLDER_PAGES } from '../constants/folder.js';
import { Page } from '../model/page.js';
import { PageStructure } from '../struc/page.js';
import { Cwd } from '../vars/cwd.js';
import { get_cache_breaker } from './cache_breaker.mjs';
import { compile_markdown } from './compile.js';
import { get_error_message } from './error.js';
import { collect_files, create_dir, exists, read, remove_index, to_extension, to_index, write } from './file.js';
import { register_inject } from './global.js';
import { Logger } from './logger.js';
import { replace_imports } from './transform.js';
import { filled_array, filled_string, in_array, is_array, is_func, is_null, match_interface } from './validate.js';

export function collect_pages(dir, package_tree) {
    if (!dir) {
        dir = Cwd.get(FOLDER_GEN_PAGES);
    }
    if (!exists(dir)) {
        return [];
    }
    const result = collect_files(dir)
        .filter((file) => {
            const file_name = basename(file);
            const extension = extname(file_name);
            // @TODO check if hekoer functions are legit anymore
            // files starting with a _ are no pages, these are helper files
            // allow only specific file extensions as pages
            if (file_name.match(/^_/) || !in_array(['.mjs', '.cjs', '.js', '.ts', '.md'], extension)) {
                return false;
            }
            return true;
        })
        .map((file) => {
            const data = {
                path: file,
                rel_path: file.replace(new RegExp(`.*/${FOLDER_PAGES}/`), `${FOLDER_PAGES}/`),
            };
            // try apply package
            if (package_tree) {
                data.pkg = package_tree[data.rel_path];
            }
            return new Page(data);
        });
    return result;
}

export async function execute_page(page) {
    if (!match_interface(page, PageStructure)) {
        Logger.warning('invalid page was given', JSON.stringify(page));
        return undefined;
    }

    const extension = extname(page.path);
    register_inject(page.rel_path);

    switch (extension) {
        case '.md': {
            let markdown;
            try {
                markdown = compile_markdown(read(page.path));
            } catch (e) {
                Logger.error(get_error_message(e, page.rel_path, 'markdown compilation'));
                Logger.debug(e);
            }
            if (is_null(markdown)) {
                return undefined;
            }
            // unfold data
            Object.keys(markdown.data).forEach((key) => {
                markdown[key] = markdown.data[key];
            });
            delete markdown.data;

            // add required url
            const ext = markdown.extension ?? 'html';
            let url = markdown.url;
            if (!filled_string(url)) {
                url = page.rel_path.replace(new RegExp(`^${FOLDER_PAGES}/`), '/').replace(/\.md$/, '');
            }
            url = to_extension(to_index(url), ext.replace(/^\./, ''));
            // remove unneeded index.html
            markdown.url = remove_index(url);

            return [markdown];
        }
        /* eslint-disable no-case-declarations */
        case '.mjs':
        case '.cjs':
        case '.js':
            const cache_breaker = get_cache_breaker();
            const uniq_path = `${page.path}${cache_breaker}`;
            let page_module, result;
            write(page.path, replace_imports(read(page.path), page.rel_path, FOLDER_GEN_SRC, 'page', cache_breaker));
            try {
                page_module = await import(uniq_path);
            } catch (e) {
                Logger.error(get_error_message(e, page.rel_path, 'page execution'));
                return undefined;
            }
            // unfold default export
            if (!is_null(page_module)) {
                page_module = page_module.default;
            }
            // execute the page
            if (is_func(page_module)) {
                try {
                    result = await page_module(page);
                } catch (e) {
                    Logger.error(get_error_message(e, page.rel_path, 'page execution'));
                    return undefined;
                }
            } else {
                result = page_module;
            }
            if (is_null(result)) {
                return undefined;
            }
            // force array
            if (!is_array(result)) {
                result = [result];
            }
            if (!filled_array(result)) {
                return undefined;
            }
            return result;
        /* eslint-enable no-case-declarations */

        default: {
            Logger.warning('unknown file extension', extension, 'for page', page.rel_path);
            return undefined;
        }
    }
}

export function write_pages(page_entries) {
    if (!filled_array(page_entries)) {
        return [];
    }
    return page_entries
        .map((page) => {
            // filter out empty or invalid entries
            if (is_null(page) || !filled_string(page.url)) {
                return undefined;
            }
            // create data json for the given file
            const raw_path = Cwd.get(FOLDER_GEN_DATA, page.url);
            const path = to_extension(to_index(raw_path, 'json'), 'json');
            create_dir(dirname(path), { recursive: true });
            write(path, JSON.stringify(page));
            return path;
        })
        .filter((x) => x);
}
