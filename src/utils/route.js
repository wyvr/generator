import { basename, extname, join } from 'path';
import { FOLDER_GEN_ROUTES } from '../constants/folder.js';
import { Route } from '../model/route.js';
import { RouteStructure } from '../struc/route.js';
import { Cwd } from '../vars/cwd.js';
import { compile_markdown } from './compile.js';
import { get_error_message } from './error.js';
import { collect_files, exists, read, remove_index, to_extension, to_index } from './file.js';
import { Logger } from './logger.js';
import { filled_array, filled_string, is_array, is_func, is_null, match_interface } from './validate.js';

export function collect_routes(dir, package_tree) {
    if (!dir) {
        dir = join(Cwd.get(), FOLDER_GEN_ROUTES);
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
            if (file_name.match(/^_/) || ['.js', '.ts', '.md'].indexOf(extension) < 0) {
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
        case '.js': {
            const uniq_path = `${route.path}?${new Date().getTime()}`;
            let route_module, result;
            try {
                route_module = await import(uniq_path);
            } catch (e) {
                Logger.error(get_error_message(e, route.rel_path, 'route execution'));
                return undefined;
            }
            // unfold default export
            if (route_module?.default) {
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
        }
        default: {
            Logger.warning('unknown file extension', extension, 'for route', route.rel_path);
            return undefined;
        }
    }

    // if (!(<any>global).getGlobal || typeof (<any>global).getGlobal != 'function') {
    //     (<any>global).getGlobal = async (key, fallback, callback) => {
    //         const result = await Global.get(key, fallback || null, callback);
    //         return result;
    //     };
    // }
    // if (route.path.match(/\.js$/)) {
    //     let route_module = null;
    //     try {
    //         route_module = await require(route.path);
    //     } catch (e) {
    //         return [e, null];
    //     }
    //     if (Array.isArray(route_module)) {
    //         return [null, route_module];
    //     }
    //     if (typeof route_module == 'function') {
    //         try {
    //             const route_result = await route_module(route);
    //             if (Array.isArray(route_result)) {
    //                 return [null, route_result];
    //             }
    //             return [null, [route_result]];
    //         } catch (e) {
    //             return [e, null];
    //         }
    //     }
    //     return [null, [route_module]];
    // }
    // return [null, null];
}
