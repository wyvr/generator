import { fail } from '@lib/helper/endings';
import { Plugin } from '@lib/plugin';
import { File } from '@lib/file';
import { Env } from '@lib/env';
import { Client } from '@lib/client';
import { existsSync, writeFileSync } from 'fs-extra';
import { join, sep } from 'path';
import { Logger } from '@lib/logger';
import { Media } from '@lib/media';
import replaceAsync from 'string-replace-async';
import { Build } from '@lib/build';
import { Error } from '@lib/error';
import { Cwd } from '@lib/vars/cwd';
import { ReleasePath } from '@lib/vars/release_path';

export const inject = async (list: string[], socket_port: number = 0): Promise<[any, any]> => {
    const [err_before, config_before, list_before] = await Plugin.before('inject', list);
    if (err_before) {
        fail(err_before);
        return [{}, null];
    }
    const shortcode_identifiers = {};
    const media = {};
    let has_media = false;
    await Promise.all(
        list_before.map(async (file) => {
            // because of an compilation error the page can be non existing
            if (!file || !existsSync(file)) {
                return null;
            }
            const content = File.read(file);
            const head = [],
                body = [];
            // inject dev socket connection
            if (Env.is_dev()) {
                body.push(
                    `<script id="wyvr_client_socket">${Client.transform_resource(
                        File.read(join(__dirname, '..', 'resource', 'client_socket.js')).replace(/\{port\}/g, socket_port)
                    )}</script>`
                );
            }

            // @INFO shortcodes
            // replace shortcodes
            let shortcode_imports = null;
            const src_path = join(Cwd.get(), 'gen', 'src');
            const replaced_content = content.replace(/\(\(([\s\S]*?)\)\)/g, (match_shortcode, inner) => {
                const match = inner.match(/([^ ]*)([\s\S]*)/);
                let name = null;
                let path = null;
                let value = null;
                if (match) {
                    value = match[1];
                } else {
                    // ignore when something went wrong
                    if (Env.is_dev()) {
                        Logger.warning('shortcode can not be replaced in', file, match);
                    }
                    return match;
                }
                // check wheter the path was given or the name
                if (value.indexOf('/') > -1) {
                    name = value.replace(/\//g, '_');
                    path = `${src_path}/${value}.svelte`;
                } else {
                    name = value;
                    path = `${src_path}/${value.replace(/_/g, '/')}.svelte`;
                }
                name = name.replace(/_(.)/g, (m, $1) => $1.toUpperCase()).replace(/^(.)/g, (m, $1) => $1.toUpperCase());
                if (!shortcode_imports) {
                    shortcode_imports = {};
                }
                shortcode_imports[name] = path;
                const data = match[2];
                const props = {};
                const data_length = data.length;
                let parentese = 0;
                let prop_name = '';
                let prop_value = '';
                for (let i = 0; i < data_length; i++) {
                    const char = data[i];
                    if (char == '{') {
                        parentese++;
                        if (parentese == 1) {
                            continue;
                        }
                    }
                    if (char == '}') {
                        parentese--;
                        if (parentese == 0) {
                            try {
                                const prop_exec = `JSON.stringify(${prop_value})`;
                                prop_value = eval(prop_exec);
                            } catch (e) {
                                Logger.debug('shortcode props can not be converted in', file, 'for', prop_name.trim());
                            }
                            props[prop_name.trim()] = prop_value.replace(/\n\s*/gm, ''); //.replace(/"/g, '&quot;');
                            prop_name = '';
                            prop_value = '';
                            continue;
                        }
                    }
                    if (char != '=' && parentese == 0) {
                        prop_name += char;
                    }
                    if (parentese > 0) {
                        prop_value += char;
                    }
                }
                const props_component = Object.keys(props)
                    .map((key) => {
                        return `${key}={${props[key]}}`;
                    })
                    .join(' ');

                return `<${name} ${props_component} />`;
            });

            const [err_after, config_after, file_after, content_after, head_after, body_after] = await Plugin.after('inject', file, replaced_content, head, body);
            if (err_after) {
                fail(err_after);
            }
            const injected_content = content_after.replace(/<\/head>/, `${head_after.join('')}</head>`).replace(/<\/body>/, `${body_after.join('')}</body>`);

            // @INFO media before shortcode replacement
            // replace media
            const media_content = await replaceAsync(injected_content, /\(media\(([\s\S]*?)\)\)/g, async (match_media, inner) => {
                const config = await Media.get_config(inner);
                // store for later transformation
                has_media = true;
                media[config.result] = config;
                return config.result;
            });

            if (!shortcode_imports) {
                writeFileSync(file, media_content);
                return file;
            }

            const imports = Object.keys(shortcode_imports)
                .map((name) => {
                    return `import ${name} from '${shortcode_imports[name]}';`;
                })
                .join('\n');
            const svelte_code = `<script>${imports}</script>${media_content}`;
            writeFileSync(file.replace('.html', '.svelte'), svelte_code);

            const [compile_error, compiled] = await Build.compile(svelte_code);

            if (compile_error) {
                // svelte error messages
                Logger.error('[svelte]', file, Error.get(compile_error, file, 'build shortcodes'));
                writeFileSync(file, media_content);
                return file;
            }
            const [render_error, rendered, identifier_item] = await Build.render(compiled, { _wyvr: { identifier: file.replace(ReleasePath.get() + sep, '') } });
            if (render_error) {
                // svelte error messages
                Logger.error('[svelte]', file, Error.get(render_error, file, 'render shortcodes'));
                writeFileSync(file, media_content);
                return file;
            }

            // @INFO media after shortcode replacement
            // replace media
            rendered.result.html = await replaceAsync(rendered.result.html, /\(media\(([\s\S]*?)\)\)/g, async (match_media, inner) => {
                const config = await Media.get_config(inner);
                // store for later transformation
                has_media = true;
                media[config.result] = config;
                return config.result;
            });

            shortcode_identifiers[identifier_item.identifier] = {
                name: identifier_item.identifier,
                shortcodes: Object.values(shortcode_imports).map((path: string) => path.replace(src_path + sep, '')),
            };

            const css_identifier = `/${join('css', identifier_item.identifier.replace(/\./g, '-'))}.css`;
            const js_identifier = `/${join('js', identifier_item.identifier.replace(/\./g, '-'))}.js`;

            writeFileSync(
                file,
                rendered.result.html
                    .replace(
                        /<\/head>/,
                        `<link rel="preload" href="${css_identifier}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${css_identifier}"></noscript></head>`
                    )
                    .replace(/<\/body>/, `<script src="${js_identifier}"></script></body>`)
            );

            return file;
        })
    );
    return [shortcode_identifiers, has_media ? media : null];
};