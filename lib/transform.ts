import { File } from '@lib/file';
import * as swc from '@swc/core';

export class Transform {
    /**
     * Replace the @src imports with the given to path
     * @param content source code with @src imports
     * @param to path to the src folder, relative to the cwd
     * @returns the soruce code ith the replaced @src imports
     */
    static src_import_path(content: string, to: string, extension: string): string {
        if (!content || typeof content != 'string' || typeof to != 'string') {
            return '';
        }
        if (extension == '.svelte') {
            // for svelte file the src import correction is only allowed inside script tags
            const extract_result = this.extract_tags_from_content(content, 'script');
            if (extract_result) {
                const replaced_scripts = extract_result.result.map((script) => {
                    return this.replace_src(script, to);
                });
                return `${replaced_scripts.join('')}${extract_result.content}`;
            }
            return content;
        }
        return this.replace_src(content, to); //gen/src
    }
    static replace_src(content: string, to: string) {
        return content.replace(/(['"])@src\//g, `$1${process.cwd()}/${to.replace('^/', '').replace(/\/$/, '')}/`);
    }
    static replace_wyvr_imports(content: string, as_client: boolean = true) {
        if (!content || typeof content != 'string') {
            return '';
        }
        // replace isServer and isClient and the imports
        return content
            .replace(/([^\w])isServer([^\w])/g, `$1${as_client ? 'false' : 'true'}$2`)
            .replace(/([^\w])isClient([^\w])/g, `$1${as_client ? 'true' : 'false'}$2`)
            .replace(/import \{[^\}]*?\} from \'@wyvr\/generator\';?/g, '')
            .replace(/(?:const|let)[^=]*?= require\(\'@wyvr\/generator\'\);?/g, '');
    }
    static async typescript_compile(path: string, content: string): Promise<boolean> {
        const output_path = File.to_extension(path, '.js');

        const result = await swc.transform(content, {
            // Some options cannot be specified in .swcrc
            filename: output_path,
            sourceMaps: true,
            // Input files are treated as module by default.
            isModule: true,

            // All options below can be configured via .swcrc
            jsc: {
                parser: {
                    syntax: 'typescript',
                    dynamicImport: true,
                    decorators: true,
                },
                transform: {},
                loose: true,
                target: 'es2016',
            },
            module: {
                type: 'commonjs',
            },
        });
        if (result) {
            File.write(output_path, result.code);
            File.write(`${output_path}.map`, result.map);
            return true;
        }

        return false;
    }
    static extract_tags_from_content(content: string, tag: string): { content: string; result: string[] } {
        if (!content || typeof content != 'string' || !tag || typeof tag != 'string') {
            return {
                content: content || '',
                result: [],
            };
        }
        let search_tag = true;
        tag = tag.toLowerCase().trim();
        const result = [];
        const tag_start = `<${tag}`;
        const tag_end = `</${tag}>`;
        let tag_start_index, tag_end_index;
        while (search_tag) {
            tag_start_index = content.indexOf(tag_start);
            tag_end_index = content.indexOf(tag_end);
            if (tag_start_index > -1 && tag_end_index > -1) {
                // append the tag into the result
                result.push(content.slice(tag_start_index, tag_end_index + tag_end.length));
                // remove the script from the content
                content = content.substr(0, tag_start_index) + content.substr(tag_end_index + tag_end.length);
                continue;
            }
            search_tag = false;
        }
        return {
            content,
            result,
        };
    }
}
