/* eslint @typescript-eslint/no-explicit-any: 0 */
import { File } from '@lib/file';
import { Logger } from '@lib/logger';
import { Transform } from '@lib/transform';
import { Build } from '@lib/build';
import { Client } from '@lib/client';
import { hrtime_to_ms } from '@lib/converter/time';
import { extname, dirname } from 'path';
import { mkdirSync } from 'fs-extra';

export const transform = async (list: string[]) => {
    // destroy getGlobal to avoid overlapping calls
    /* eslint-disable @typescript-eslint/no-explicit-any */
    delete (<any>global).getGlobal;
    /* eslint-enable */

    await Promise.all(
        list.map(async (file) => {
            let content = File.read(file);
            if (file.match(/\.svelte$/)) {
                // combine svelte files
                const merged = Transform.insert_splits(file, content);
                content = merged.content;
                File.remove(merged.css);
                File.remove(merged.js);
                // convert other formats, scss, ...
                const [pre_error, preprocessed_content] = Transform.preprocess_content(content);
                if (pre_error) {
                    Logger.error(pre_error);
                }
                // replace the css imports
                content = Transform.insert_css_imports(pre_error ? content : preprocessed_content, file);
                File.write(file, content);
            }

            const extension = extname(file);

            /**
             * Compile server version
             */
            const server_path = file.replace(/^gen\/raw/, 'gen/src');
            // replace wyvr values/imports
            const server_content = Build.correct_import_paths(
                Transform.replace_wyvr_imports(content, false),
                extension
            );
            if (extension == '.ts') {
                const ts_duration = process.hrtime();
                await Transform.typescript_compile(server_path, server_content);
                Logger.debug('compiled server', server_path, 'in', hrtime_to_ms(process.hrtime(ts_duration)), 'ms');
            } else {
                File.write(server_path, server_content);
            }

            /**
             * Compile client/browser version
             */
            // prepare for the client
            const client_path = file.replace(/^gen\/raw/, 'gen/client');
            mkdirSync(dirname(client_path), { recursive: true });
            // replace wyvr values/imports
            let client_content = Client.correct_import_paths(
                Client.remove_on_server(Transform.replace_wyvr_imports(content, true)),
                extension
            );

            switch (extension) {
                case '.svelte': {
                    client_content = Client.replace_slots_client(client_content);
                    File.write(client_path, client_content);
                    break;
                }
                case '.ts': {
                    const ts_duration = process.hrtime();
                    // client file
                    await Transform.typescript_compile(client_path, client_content);
                    Logger.debug('compiled client', server_path, 'in', hrtime_to_ms(process.hrtime(ts_duration)), 'ms');
                    break;
                }
                default:
                    File.write(client_path, client_content);
                    break;
            }
            return null;
        })
    );
    return list;
};
