import * as fs from 'fs-extra';
import { join, dirname, extname, basename } from 'path';
import { compile } from 'svelte/compiler';
import register from 'svelte/register';
import { Client } from '@lib/client';
import { Env } from '@lib/env';
import { WyvrCssMediaCollection } from '@lib/model/wyvr/file';
import { Transform } from '@lib/transform';
import { I18N } from '@lib/i18n';
import { IBuildResult } from '@lib/interface/build';
import { IObject } from '@lib/interface/object';
import { EnvType } from '@lib/struc/env';
import { File } from '@lib/file';
import { ReleasePath } from '@lib/vars/release_path';
import { Optimize } from './optimize';

register();
/* eslint-disable @typescript-eslint/no-explicit-any */
// fix intl global on the server side
(<any>global).Intl = require('intl');
// onServer Server implementation
(<any>global).onServer = async (callback: () => Promise<any>) => {
    if (callback && typeof callback == 'function') {
        return await callback();
    }
    return null;
};
(<any>global)._wyvrGenerateProp = (prop: string, value: any) => {
    const converted = JSON.stringify(value);
    if(converted.length > 1000) {
        const hash = Optimize.create_hash(converted);
        File.write(join('gen', 'prop', `${prop}_${hash}.json`), converted);
        return `|${prop}|:|@(/prop/${prop}_${hash}.json)|`
    }
    return `|${prop}|:${converted.replace(/\|/g, '§|§').replace(/"/g, "|")}`;
};
(<any>global).isServer = true;
(<any>global).isClient = false;
(<any>global).__ = I18N.translate;
/* eslint-enable */
export class Build {
    static async compile(content: string): Promise<[IObject, IBuildResult]> {
        if (!content || typeof content != 'string') {
            return [new Error('content has to be a string'), null];
        }
        try {
            const compiled = await compile(content, {
                dev: Env.is_dev(),
                generate: 'ssr',
                format: 'cjs',
                immutable: true,
                hydratable: true,
                cssHash: Client.css_hash,
            });
            const component = await eval(compiled.js.code);
            return [null, { compiled, component, result: null, notes: [] }];
        } catch (e) {
            return [e, null];
        }
    }
    static async render(svelte_render_item, props) {
        const propNames = Object.keys(props);
        if (Array.isArray(propNames) && Array.isArray(svelte_render_item.compiled.vars)) {
            // check for not used props
            const unused_props = propNames.filter((prop) => {
                return (
                    svelte_render_item.compiled.vars.find((v) => {
                        return v.name == prop;
                    }) == null
                );
            });
            if (unused_props.length > 0) {
                svelte_render_item.notes.push({ msg: 'unused props', details: unused_props });
            }
        }

        // set the correct translations for the page
        I18N.setup();
        const translations = I18N.get(props._wyvr.language);
        I18N.i18n.init(translations);
        try {
            svelte_render_item.result = await svelte_render_item.component.render(props);
        } catch (e) {
            return [e, null];
        }
        // write css file
        const css_file_path = join('gen', 'css', `${props._wyvr.identifier.replace(/\./g, '-')}.css`);
        const identifier_item = {
            url: props.url,
            identifier: props._wyvr.identifier,
            extension: props._wyvr.extension,
        };
        let media_files = {};
        if (!fs.existsSync(css_file_path)) {
            media_files = await this.write_css_file(css_file_path, svelte_render_item.result.css.code);
        } else {
            const last_modified = fs.statSync(css_file_path).mtime;
            // changes in the time range of 5 seconds avoids recreation of css files
            // @WARN when hugh amounts of data gets generated css files can be written multiple times
            if (new Date().getTime() - new Date(last_modified).getTime() > 5000) {
                media_files = await this.write_css_file(css_file_path, svelte_render_item.result.css.code);
            }
        }
        // when there are media files returned, create them
        await this.write_media_files(css_file_path, media_files);
        if (Object.keys(media_files).length > 0) {
            // inject media css files
            svelte_render_item.result.html = await this.inject_media_files(
                svelte_render_item.result.html,
                css_file_path,
                media_files
            );
        }
        // inject translations
        if (translations) {
            svelte_render_item.result.html = svelte_render_item.result.html.replace(
                /<\/body>/,
                `<script>var wyvr_i18n_tr = ${JSON.stringify(translations)}</script></body>`
            );
        }

        // svelte_render_item.result.html = svelte_render_item.result.html.replace('</head>', `<style>${svelte_render_item.result.css.code}</style></head>`);
        return [null, svelte_render_item, identifier_item];
    }
    /**
     * write css file
     * @param css_file_path the css file path which gets created
     * @param css_code the content of the css file
     * @returns WyvrCssMediaCollection with media query as key and the content as the value
     */
    static async write_css_file(css_file_path: string, css_code: string) {
        fs.mkdirSync(dirname(css_file_path), { recursive: true });
        const media_files: WyvrCssMediaCollection = {};
        if (Env.is_prod()) {
            // extract the media queries from the css_code
            css_code = css_code.replace(/@media([^{]*)\{((?:(?!\}\s*\}).)*\})}/g, (match, media, code) => {
                const key = media.trim();
                if (!media_files[key]) {
                    media_files[key] = '';
                }
                // append to the media query to generate a single file
                media_files[key] += code;
                return '';
            });
        }
        fs.writeFileSync(css_file_path, css_code);
        return media_files;
    }
    /**
     * write media css files
     * @param css_file_path css path to generate the correct path to the file
     * @param media_files WyvrCssMediaCollection with media query as key and the content as the value
     * @returns Promise<void>
     */
    static async write_media_files(css_file_path: string, media_files: WyvrCssMediaCollection): Promise<void> {
        const keys = Object.keys(media_files);
        if (!css_file_path || keys.length == 0) {
            return;
        }
        keys.forEach((key, index) => {
            const media_file_path = this.append_to_file_path(css_file_path, index + '');
            fs.writeFileSync(media_file_path, media_files[key]);
        });
    }
    /**
     * inject media css files into the given html
     * @param html where the media files should be injected
     * @param css_file_path css path to generate the correct path to the file
     * @param media_files WyvrCssMediaCollection with media query as key and the content as the value
     * @returns the modified html
     */
    static inject_media_files(html: string, css_file_path: string, media_files: WyvrCssMediaCollection) {
        const media_includes = Object.keys(media_files)
            .map((key, index) => {
                const path = '/css/' + basename(this.append_to_file_path(css_file_path, index + ''));
                // @NOTE to get correct critical css this is not allowed to be preloaded
                // return `<link rel="preload" href="${path}" as="style" onload="this.onload=null;this.media='${key}';this.rel='stylesheet'">
                // <noscript><link rel="stylesheet" href="${path}" media="${key}"></noscript>`;
                return `<link rel="stylesheet" href="${path}" media="${key}">`;
            })
            .join('\n');
        return html.replace('</head>', media_includes);
    }
    /**
     * add text to a file path
     * @param path file path
     * @param append will be appended before the extension
     * @returns the m,odified file path
     */
    static append_to_file_path(path: string, append: string) {
        const extension = extname(path);
        return path.replace(extension, `_${append}${extension}`);
    }
    // precompile the components to check whether there is only global data used
    static precompile_components() {
        //@TODO implement
    }
    static get_page_code(data: IObject, doc_file_name: string, layout_file_name: string, page_file_name: string) {
        const code = `
        <script>
            import Doc from '${doc_file_name}';
            import Layout from '${layout_file_name}';
            import Page from '${page_file_name}';
            const data = ${JSON.stringify(data, null, Env.json_spaces(process.env))};
        </script>

        <Doc data={data}>
            <Layout data={data}>
                <Page data={data}>
                {@html data.content || ''}
                </Page>
            </Layout>
        </Doc>`;
        return code;
    }
    static correct_import_paths(content: string, extension: string): string {
        return Transform.src_import_path(content, 'gen/src', extension);
    }
    static add_debug_code(html: string, path: string, extension: string, data: IObject) {
        // add debug data
        if (extension.match(/html|htm|php/) && (Env.get() == EnvType.debug || Env.get() == EnvType.dev)) {
            const data_path = File.to_extension(path, 'json');
            File.write(data_path, JSON.stringify(data));
            return html.replace(
                /<\/body>/,
                `<script>
                                async function wyvr_fetch(path) {
                                    let response = null;
                                    try {
                                        response = await fetch(path);
                                    } catch(e) {
                                        return null;
                                    }
                                    if(!response) {
                                        return null;
                                    }
                                    try {
                                        const data = await response.json();
                                        return data;
                                    } catch(e){
                                        return null;
                                    }
                                }
                                async function wyvr_debug_inspect_data() {
                                    console.group('wyvr: Inspect data');
                                    window.data = await wyvr_fetch('${data_path.replace(ReleasePath.get(), '')}');
                                    console.log(window.data);
                                    console.info('now available inside "data"')
                                    console.groupEnd();
                                }
                                async function wyvr_debug_inspect_global_data() {
                                    console.group('wyvr: Inspect global data');
                                    window.global_data = await wyvr_fetch('/_global.json');
                                    console.log(window.global_data);
                                    console.info('now available inside "global_data"')
                                    console.groupEnd();
                                }
                                async function wyvr_debug_inspect_structure_data() {
                                    console.group('wyvr: Inspect structure');
                                    if(window.structure) {
                                        console.log(window.structure);
                                        console.groupEnd();
                                        return;
                                    }
                                    window.structure = await wyvr_fetch('/${data._wyvr?.identifier}.json');
                                    if(! window.structure) {
                                        console.warn('structure not available')
                                        console.info('in exec only is the structure not available')
                                        console.groupEnd();
                                        return;
                                    }
                                    // append shortcodes when available
                                    const shortcode_path = '${path.replace(ReleasePath.get(), '')}';
                                    if(shortcode_path) {
                                        const shortcodes = await wyvr_fetch(shortcode_path + '.json');
                                        if(shortcodes) {
                                            window.structure.shortcodes = shortcodes;
                                        }
                                    }
                                    console.log(window.structure);
                                    console.info('now available inside "structure"')
                                    console.groupEnd();

                                }
                                </script></body>`
            );
        }
        return html;
    }
    static cleanup_page_code(html: string, extension: string) {
        if (extension.match(/html|htm|php/)) {
            return html;
        }
        // remove svelte integrated comment from compiler to avoid broken output, when not html compatible
        return html.replace(/<!-- HTML_TAG_(?:START|END) -->/g, '');
    }
}
