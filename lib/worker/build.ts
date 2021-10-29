/* eslint @typescript-eslint/no-explicit-any: 0 */
import { Env } from '@lib/env';
import { Error } from '@lib/error';
import { File } from '@lib/file';
import { Logger } from '@lib/logger';
import { EnvModel } from '@lib/model/env';
import { ReleasePath } from '@lib/vars/release_path';
import { join } from 'path';
import { Build } from '@lib/build';
import { Cwd } from '@lib/vars/cwd';
import { IObject } from '@lib/interface/object';
import { IBuildFileResult } from '@lib/interface/build';

export const build = async (value: any[], create_identifier: (any) => any): Promise<[IObject[], IBuildFileResult[]]> => {
    if (!create_identifier || typeof create_identifier != 'function') {
        return [null, null];
    }
    const identifier_list = [];
    const build_result = await Promise.all(
        value.map(async (filename) => {
            const data = File.read_json(filename);
            if (!data) {
                Logger.error('broken/missing/empty file', filename);
                return null;
            }
            const result = create_identifier(data);

            const page_code = Build.get_page_code(result.data, result.doc, result.layout, result.page);
            const [compile_error, compiled] = await Build.compile(page_code);

            if (compile_error) {
                // svelte error messages
                Logger.error('[svelte]', data.url, Error.get(compile_error, filename, 'build'));
                return null;
            }
            const [render_error, rendered, identifier_item] = await Build.render(compiled, data);
            if (render_error) {
                // svelte error messages
                Logger.error('[svelte]', data.url, Error.get(render_error, filename, 'render'));
                return null;
            }
            // change extension when set
            const extension = data._wyvr?.extension;
            const path = File.to_extension(filename.replace(join(Cwd.get(), 'gen', 'data'), ReleasePath.get()), extension);
            // add debug data
            if (extension.match(/html|htm|php/) && (Env.get() == EnvModel.debug || Env.get() == EnvModel.dev)) {
                const data_path = File.to_extension(path, 'json');
                rendered.result.html = rendered.result.html.replace(
                    /<\/body>/,
                    `<script>
                                    async function wyvr_fetch(path) {
                                        try {
                                            const response = await fetch(path);
                                            const data = await response.json();
                                            return data;
                                        } catch(e){
                                            console.error(e);
                                            return null;
                                        }
                                    }
                                    async function wyvr_debug_inspect_data() {
                                        window.data = await wyvr_fetch('${data_path.replace(ReleasePath.get(), '')}');
                                        console.log(window.data);
                                        console.info('now available inside "data"')
                                    }
                                    async function wyvr_debug_inspect_global_data() {
                                        window.global_data = await wyvr_fetch('/_global.json');
                                        console.log(window.global_data);
                                        console.info('now available inside "global_data"')
                                    }
                                    async function wyvr_debug_inspect_structure_data() {
                                        window.structure = await wyvr_fetch('/${data._wyvr?.identifier}.json');
                                        console.log(window.structure);
                                        console.info('now available inside "structure"')
                                    }
                                    </script></body>`
                );
                File.write(data_path, JSON.stringify(data));
            }
            if (identifier_item) {
                identifier_item.path = path;
                identifier_item.filename = filename;
                identifier_list.push(identifier_item);
            }

            // remove svelte integrated comment from compiler to avoid broken output
            if (!extension.match(/html|htm|php/)) {
                rendered.result.html = rendered.result.html.replace(/<!-- HTML_TAG_(?:START|END) -->/g, '');
            }
            File.write(path, rendered.result.html);

            return { path, filename, doc: result.doc, layout: result.layout, page: result.page, identifier: result.identifier, _wyvr: data._wyvr };
        })
    );
    return [identifier_list, build_result];
};
