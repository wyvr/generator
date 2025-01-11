import { basename, dirname, extname } from 'node:path';
import { FOLDER_GEN_DATA, FOLDER_GEN_PAGES, FOLDER_GEN_SRC, FOLDER_PAGES } from '../constants/folder.js';
import { Page } from '../model/page.js';
import { PageStructure } from '../struc/page.js';
import { Cwd } from '../vars/cwd.js';
import { dev_cache_breaker } from './cache_breaker.js';
import { compile_markdown } from './compile.js';
import { get_error_message } from './error.js';
import { collect_files, create_dir, exists, read, remove_index, to_extension, to_index, write } from './file.js';
import { register_inject, register_stack } from './global.js';
import { Logger } from './logger.js';
import { extract_headings_from_content, replace_imports } from './transform.js';
import { filled_array, filled_string, in_array, is_array, is_func, is_null, match_interface } from './validate.js';
import { get_config_cache, set_config_cache } from './config_cache.js';
import { uniq_id, uniq_values } from './uniq.js';
import { clone } from './json.js';
import { PageIdentifier } from '../model/page_identifier.js';
import { register_csp } from '../model/csp.js';

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
            // @TODO check if helper functions are legit anymore
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
                rel_path: file.replace(new RegExp(`.*/${FOLDER_PAGES}/`), `${FOLDER_PAGES}/`)
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
    register_stack();
    register_csp();

    switch (extension) {
        case '.md': {
            let markdown;
            try {
                markdown = compile_markdown(read(page.path));
                /* c8 ignore start */
            } catch (e) {
                Logger.error(get_error_message(e, page.rel_path, 'markdown compilation'));
                Logger.debug(e);
            }
            /* c8 ignore end */
            if (is_null(markdown)) {
                return undefined;
            }
            const data = {
                content: markdown.content,
                $headings: extract_headings_from_content(markdown.content)
            };
            // unfold data
            for (const [key, value] of Object.entries(markdown.data)) {
                data[key] = value;
            }

            // add required url
            const ext = markdown.extension ?? 'html';
            let url = markdown.url;
            if (!filled_string(url)) {
                url = page.rel_path.replace(new RegExp(`^${FOLDER_PAGES}/`), '/').replace(/\.md$/, '');
            }
            url = to_extension(to_index(url), ext.replace(/^\./, ''));
            // remove unneeded index.html
            data.url = remove_index(url);
            data.$uid = uniq_id();

            return [data];
        }

        case '.mjs':
        case '.cjs':
        case '.js': {
            const uniq_path = dev_cache_breaker(page.path);
            let page_module;
            let result;
            write(page.path, replace_imports(read(page.path), page.rel_path, FOLDER_GEN_SRC, 'page'));
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
            return result.map((page) => {
                page.$uid = uniq_id();
                return page;
            });
        }

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
    const db = new PageIdentifier();
    return page_entries
        .map((page) => {
            // filter out empty or invalid entries
            if (is_null(page) || !filled_string(page.url)) {
                return undefined;
            }
            let path = page.data_path;
            if (!path) {
                path = get_page_data_path(page);
            }
            if (page?.$wyvr?.identifier_data) {
                db.update_file(path, page.$wyvr.identifier_data);
            }
            // create data json for the given file
            create_dir(dirname(path), { recursive: true });
            write(path, JSON.stringify(page));
            return path;
        })
        .filter((x) => x);
}

export function get_page_data_path(page) {
    if (filled_string(page)) {
        return get_data_page_path(page);
    }
    if (is_null(page) || !filled_string(page.url)) {
        return undefined;
    }
    return get_data_page_path(page.url);
}

export function get_data_page_path(path) {
    const raw_path = Cwd.get(FOLDER_GEN_DATA, path);
    return to_extension(to_index(raw_path, 'json'), 'json');
}

export function get_page_from_url(url) {
    const cache = get_config_cache('page.cache');
    if (!filled_array(cache)) {
        return undefined;
    }
    const clean_url = url.split('?')[0];
    if (!clean_url) {
        return undefined;
    }
    const page = cache.find((page) => {
        return filled_array(page?.urls) && page.urls.find((url) => clean_url === url);
    });
    return page;
}

export function update_pages_cache(page_objects) {
    const cache = get_config_cache('page.cache');
    if (!filled_array(cache)) {
        return false;
    }
    const pages = is_array(page_objects) ? page_objects : [page_objects];

    // build index
    const cache_index = {};
    for (const [index, cache_page] of cache.entries()) {
        cache_page.index = index;
        cache_index[cache_page.path] = cache_page;
    }

    for (const page of pages) {
        const cache_page = cache_index[page.path];
        if (!cache_page) {
            continue;
        }
        const urls = uniq_values([].concat(page.urls, cache_page.urls));
        const new_page = clone(page);
        new_page.urls = urls;
        cache[cache_page.index] = new_page;
    }
    set_config_cache('page.cache', cache, false);
}
