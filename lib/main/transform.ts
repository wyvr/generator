import { Dir } from '@lib/dir';
import { Error } from '@lib/error';
import { File } from '@lib/file';
import { Global } from '@lib/global';
import { Logger } from '@lib/logger';
import { Plugin } from '@lib/plugin';
import { Transform } from '@lib/transform';
import { Build } from '@lib/build';
import { Client } from '@lib/client';
import { hrtime_to_ms } from '@lib/converter/time';
import { WyvrFileLoading } from '@lib/model/wyvr/file';
import { extname, dirname } from 'path';
import { mkdirSync } from 'fs-extra';

export const transform = async () => {
    // replace global in all files
    const all_files = File.collect_files('gen/raw');
    // @NOTE: plugin is only allowed to change the content of the files itself, no editing of the list
    await Plugin.before('transform', all_files);
    // destroy getGlobal to avoid overlapping calls
    delete (<any>global).getGlobal;

    await Promise.all(
        all_files.map(async (file) => {
            let content = File.read(file);
            if (file.match(/\.svelte$/)) {
                // combine svelte files
                content = Transform.insert_splits(file, content);
                // convert other formats, scss, ...
                const [pre_error, preprocessed_content] = Transform.preprocess_content(content);
                if (pre_error) {
                    Logger.error(pre_error);
                }
                // replace the css imports
                content = Transform.insert_css_imports(pre_error ? content : preprocessed_content, file);
            }

            try {
                const result_content = await Global.replace_global(content);
                File.write(file, result_content);
            } catch (e) {
                Logger.error(Error.get(e, file, 'wyvr'));
            }
            return null;
        })
    );

    // destroy the client folder to avoid old versions
    Dir.clear('gen/client');
    // copy js/ts files to client, because stores and additional logic is "hidden" there
    await Promise.all(
        all_files.map(async (raw_path) => {
            const extension = extname(raw_path);
            let src_path = raw_path.replace(/^gen\/raw/, 'gen/src');
            // prepare for the client
            let client_path = raw_path.replace(/^gen\/raw/, 'gen/client');
            mkdirSync(dirname(client_path), { recursive: true });
            // replace wyvr values/imports
            const content = File.read(raw_path);
            let server_content = Build.correct_import_paths(Transform.replace_wyvr_imports(content, false), extension);
            let client_content = Client.correct_import_paths(Client.remove_on_server(Transform.replace_wyvr_imports(content, true)), extension);
            let write_files = true;

            switch (extension) {
                case '.svelte':
                    client_content = Client.replace_slots_client(client_content);
                    break;
                case '.ts':
                    const ts_duration = process.hrtime();
                    // server file
                    await Transform.typescript_compile(src_path, server_content);
                    // client file
                    await Transform.typescript_compile(client_path, client_content);
                    Logger.debug('compiled', src_path, 'in', hrtime_to_ms(process.hrtime(ts_duration)), 'ms');
                    write_files = false;
                    break;
                case '.js':
                default:
                    break;
            }
            if (write_files) {
                File.write(src_path, server_content);
                File.write(client_path, client_content);
            }
            return null;
        })
    );

    const svelte_files = File.collect_svelte_files('gen/src');
    const hydrateable_files = Client.get_hydrateable_svelte_files(svelte_files);
    // validate hydratable files
    hydrateable_files.map((file) => {
        if (file.config?.loading == WyvrFileLoading.none && !file.config?.trigger) {
            Logger.error(Logger.color.dim('[wyvr]'), file.rel_path, 'trigger prop is required, when loading is set to none');
        }
        if (file.config?.loading == WyvrFileLoading.media && !file.config?.media) {
            Logger.error(Logger.color.dim('[wyvr]'), file.rel_path, 'media prop is required, when loading is set to media');
        }
    });
    const transformed_files = Client.transform_hydrateable_svelte_files(hydrateable_files);
    await Plugin.after('transform', transformed_files);
    return {
        src: svelte_files,
        client: transformed_files,
    };
};
