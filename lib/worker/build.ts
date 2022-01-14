/* eslint @typescript-eslint/no-explicit-any: 0 */
import { Error } from '@lib/error';
import { File } from '@lib/file';
import { Logger } from '@lib/logger';
import { ReleasePath } from '@lib/vars/release_path';
import { join } from 'path';
import { Build } from '@lib/build';
import { Cwd } from '@lib/vars/cwd';
import { IObject } from '@lib/interface/object';
import { IBuildFileResult } from '@lib/interface/build';
import { hrtime_to_ms } from '@lib/converter/time';

export const build = async (
    value: any[],
    create_identifier: (any) => any,
    write_result = true
): Promise<[IObject[], IBuildFileResult[]]> => {
    if (!create_identifier || typeof create_identifier != 'function') {
        return [null, null];
    }
    const identifier_list = [];
    const build_result = await Promise.all(
        value.map(async (filename) => {
            const start = process.hrtime();
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
            const path = File.to_extension(
                filename.replace(join(Cwd.get(), 'gen', 'data'), ReleasePath.get()),
                extension
            );

            if (identifier_item) {
                identifier_item.path = path;
                identifier_item.filename = filename;
                identifier_list.push(identifier_item);
            }

            // remove svelte integrated comment from compiler to avoid broken output
            rendered.result.html = Build.cleanup_page_code(
                Build.add_debug_code(rendered.result.html, path, extension, data),
                extension
            );

            if (write_result) {
                File.write(path, rendered.result.html);
            }

            Logger.report(hrtime_to_ms(process.hrtime(start)), 'build', path);
            
            return {
                path,
                filename,
                doc: result.doc,
                layout: result.layout,
                page: result.page,
                identifier: result.identifier,
                _wyvr: data._wyvr,
            };
        })
    );
    return [identifier_list, build_result];
};
