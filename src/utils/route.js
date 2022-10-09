import { basename, dirname, extname } from 'path';
import { FOLDER_GEN_DATA, FOLDER_GEN_ROUTES, FOLDER_GEN_SRC } from '../constants/folder.js';
import { Route } from '../model/route.js';
import { RouteStructure } from '../struc/route.js';
import { Cwd } from '../vars/cwd.js';
import { compile_markdown } from './compile.js';
import { get_error_message } from './error.js';
import { collect_files, create_dir, exists, read, remove_index, to_extension, to_index, write } from './file.js';
import { register_inject } from './global.js';
import { Logger } from './logger.js';
import { replace_imports } from './transform.js';
import { filled_array, filled_string, in_array, is_array, is_func, is_null, match_interface } from './validate.js';

export function collect_routes(dir, package_tree) {
    if (!dir) {
        dir = Cwd.get(FOLDER_GEN_ROUTES);
    }
    if (!exists(dir)) {
        return [];
    }
    const result = collect_files(dir)
        .filter((file) => {
            const file_name = basename(file);
            const extension = extname(file_name);
            // files starting with a _ are no routes, these are helper files
            // allow only specific file extensions as routes
            if (file_name.match(/^_/) || !in_array(['.mjs', ',cjs', '.js', '.ts', '.md'], extension)) {
                return false;
            }
            return true;
        })
        .map((file) => {
            const data = {
                path: file,
                rel_path: file.replace(/.*?\/routes\//, 'routes/'),
            };
            // try apply package
            if (package_tree) {
                data.pkg = package_tree[data.rel_path];
            }
            return new Route(data);
        });
    return result;
}

export async function execute_route(route) {
    if (!match_interface(route, RouteStructure)) {
        Logger.warning('invalid route was given', JSON.stringify(route));
        return undefined;
    }

    const extension = extname(route.path);
    register_inject(route.rel_path);

    switch (extension) {
        case '.md': {
            const markdown = compile_markdown(read(route.path));
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
                url = route.rel_path.replace(/^routes\//, '/').replace(/\.md$/, '');
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
            const cache_breaker = `?${Date.now()}`;
            const uniq_path = `${route.path}?${cache_breaker}`;
            let route_module, result;
            write(
                route.path,
                replace_imports(read(route.path), route.rel_path, FOLDER_GEN_SRC, 'route', cache_breaker)
            );
            try {
                route_module = await import(uniq_path);
            } catch (e) {
                Logger.error(get_error_message(e, route.rel_path, 'route execution'));
                return undefined;
            }
            // unfold default export
            if (!is_null(route_module)) {
                route_module = route_module.default;
            }
            // execute the route
            if (is_func(route_module)) {
                try {
                    result = await route_module(route);
                } catch (e) {
                    Logger.error(get_error_message(e, route.rel_path, 'route execution'));
                    return undefined;
                }
            } else {
                result = route_module;
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
            Logger.warning('unknown file extension', extension, 'for route', route.rel_path);
            return undefined;
        }
    }
}

export function write_routes(route_entries) {
    if (!filled_array(route_entries)) {
        return [];
    }
    return route_entries
        .map((route) => {
            // filter out empty or invalid entries
            if (is_null(route) || !filled_string(route.url)) {
                return undefined;
            }
            // create data json for the given file
            const raw_path = Cwd.get(FOLDER_GEN_DATA, route.url);
            const path = to_extension(to_index(raw_path, 'json'), 'json');
            create_dir(dirname(path), { recursive: true });
            write(path, JSON.stringify(route));
            return path;
        })
        .filter((x) => x);
}
