import { File } from '@lib/file';
import * as swc from '@swc/core';
import { sep, join } from 'path';
import {existsSync} from 'fs';
import { Logger } from '@lib/logger';
import sass from 'sass';
import { Error } from '@lib/error';
import { Cwd } from '@lib/vars/cwd';

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
            const extract_result = this.extract_tags_from_content(content, 'script', 1);
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
        return content.replace(/(['"])@src\//g, `$1${Cwd.get()}/${to.replace('^/', '').replace(/\/$/, '')}/`);
    }
    static replace_wyvr_imports(content: string, as_client: boolean) {
        if (!content || typeof content != 'string') {
            return '';
        }
        // modify __ => translation
        if(as_client) {
            content = content.replace(/(\W)__\(/g, '$1window.__(')
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
    static extract_tags_from_content(content: string, tag: string, max = 0): { content: string; result: string[] } {
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
                // allow that not all tags should be extracted
                if(max > 0 && result.length == max) {
                    search_tag = false;
                }
                continue;
            }
            search_tag = false;
        }
        return {
            content,
            result,
        };
    }
    static preprocess_content(content: string): [any, string] {
        if (!content || typeof content != 'string') {
            return [null, ''];
        }
        const style_result = Transform.extract_tags_from_content(content, 'style');
        if (style_result && style_result.result && style_result.result.some((entry) => entry.indexOf('type="text/scss"') > -1 || entry.indexOf('lang="sass"') > -1)) {
            let sass_result = null;
            try {
                sass_result = sass.renderSync({
                    data: style_result.result
                        .map((entry) => {
                            const raw = entry.replace(/<style[^>]*>/g, '').replace(/<\/style>/g, '');
                            return this.src_import_path(raw, 'gen/raw', '.css');
                        })
                        .join('\n'),
                });
            } catch (e) {
                return [Error.get(e, e.file, 'sass'), content];
            }
            if (sass_result) {
                return [null, `${style_result.content}<style>${sass_result.css.toString()}</style>`];
            }
        }

        return [null, content];
    }
    static insert_css_imports(content: string, file_path: string) {
        // replace @import in css
        // @NOTE this will also work in non css context
        const src_segment = `${sep}raw${sep}`;
        const src_path = join(file_path.substr(0, file_path.indexOf(src_segment) + src_segment.length - 1));

        return content.replace(/@import '@src\/([^']*)';/, (match, url) => {
            const import_path = join(src_path, url);
            const import_css = File.read(import_path);
            // @NOTE scss has another syntax e.g. folder/file => folder/_file.scss
            if (import_css == null) {
                Logger.warning(`${Logger.color.dim('[css]')}' can not import ${url} into ${file_path}, maybe the file doesn't exist`);
                return '';
            }
            return import_css;
        });
    }

    static insert_splits(file_path: string, content: string): string {
        if (!file_path || !existsSync(file_path) || !content || typeof content != 'string') {
            return '';
        }
        const css_file = File.to_extension(file_path, 'css');
        if (existsSync(css_file)) {
            const css_content = File.read(css_file);
            const css_result = this.extract_tags_from_content(content, 'style');
            const combined_css = css_result.result
                .map((style) => {
                    return style.replace(/^<style>/, '').replace(/<\/style>$/, '');
                })
                .join('\n');
            content = `${css_result.content}<style>${combined_css}${css_content}</style>`;
        }
        const js_file = File.to_extension(file_path, 'js');
        if (existsSync(js_file)) {
            const js_content = File.read(js_file);
            const js_result = this.extract_tags_from_content(content, 'script');
            const combined_js = js_result.result
                .map((script) => {
                    return script.replace(/^<script>/, '').replace(/<\/script>$/, '');
                })
                .join('\n');
            content = `<script>${combined_js}${js_content}</script>${js_result.content}`;
        }
        return content;
    }
}
