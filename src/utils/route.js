import { basename, extname, join } from 'path';
import { FOLDER_GEN_ROUTES } from '../constants/folder.js';
import { Route } from '../model/route.js';
import { RouteStructure } from '../struc/route.js';
import { Cwd } from '../vars/cwd.js';
import { compile_markdown } from './compile.js';
import { collect_files, exists, read, to_extension } from './file.js';
import { Logger } from './logger.js';
import { is_null, match_interface } from './validate.js';

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
            if (!markdown.url) {
                const ext = markdown.extension ?? 'html';
                let url = to_extension(route.rel_path.replace(/^routes\//, '/'), ext.replace(/^\./, ''));
                // remove unneeded index.html
                if (url.indexOf('index.htm') > -1) {
                    url = url.replace(/index\.htm[l]$/, '');
                }
                markdown.url = url;
            }

            return markdown;
        }
        default: {
            Logger.warning('unknown file extension', extension, 'for route', route.rel_path);
            return undefined;
        }
    }

    // if (!route || !route.path) {
    //     return [`broken route ${JSON.stringify(route)}`, null];
    // }
    // if (!(<any>global).getGlobal || typeof (<any>global).getGlobal != 'function') {
    //     (<any>global).getGlobal = async (key, fallback, callback) => {
    //         const result = await Global.get(key, fallback || null, callback);
    //         return result;
    //     };
    // }
    // route.env = Env.get();
    // if (route.path.match(/\.md$/)) {
    //     const content = File.read(route.path);
    //     if (!content) {
    //         return [null, null];
    //     }
    //     try {
    //         const data: any = fm(content);
    //         if (typeof data.body == 'string') {
    //             data.content = marked(data.body, {
    //                 breaks: false,
    //             }).replace(/<code[^>]*>[\s\S]*?<\/code>/g, (match) => {
    //                 const replaced = match.replace(/\{/g, '&lbrace;').replace(/\}/g, '&rbrace;');
    //                 return replaced;
    //             });
    //             // remove the original markdown code because it breaks the injection of data
    //             delete data.body;
    //         }
    //         // unfold attributes
    //         Object.keys(data.attributes).forEach((key) => {
    //             data[key] = data.attributes[key];
    //         });
    //         if (data.frontmatter) {
    //             delete data.frontmatter;
    //         }
    //         delete data.attributes;
    //         // add required url
    //         if (!data.url) {
    //             let url = File.to_extension(route.rel_path.replace(/^routes\//, '/'), 'html');
    //             // remove unneeded index.html
    //             if (url.indexOf('index.htm') > -1) {
    //                 url = url.replace(/index\.htm[l]$/, '');
    //             }
    //             data.url = url;
    //         }
    //         return [null, [data]];
    //     } catch (e) {
    //         return [e, null];
    //     }
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
