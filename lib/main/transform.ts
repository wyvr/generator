import { Dir } from '@lib/dir';
import { File } from '@lib/file';
import { Logger } from '@lib/logger';
import { Plugin } from '@lib/plugin';
import { Client } from '@lib/client';
import { WyvrFileLoading } from '@lib/model/wyvr/file';
import { WorkerAction } from '@lib/model/worker/action';
import { WorkerController } from '@lib/worker/controller';
import { Global } from '@lib/global';
import { Error } from '@lib/error';

export const transform = async (worker_controller: WorkerController) => {
    // replace global in all files
    const raw_files = File.collect_files('gen/raw');
    // @NOTE: plugin is only allowed to change the content of the files itself, no editing of the list
    await Plugin.before('transform', raw_files);

    // destroy the client folder to avoid old versions
    Dir.clear('gen/client');

    // process in worker
    await worker_controller.process_in_workers('transform', WorkerAction.transform, raw_files, 10);

    let index = 0;
    const all_files = [].concat(File.collect_files('gen/client'), File.collect_files('gen/src'));
    const len = all_files.length;
    while (index < len) {
        const file = all_files[index];
        try {
            const content = File.read(file);
            const result_content = await Global.replace_global(content);
            File.write(file, result_content);
        } catch (e) {
            Logger.error(Error.get(e, file, 'wyvr'));
        }
        index++;
    }

    const svelte_files = File.collect_svelte_files('gen/src');
    const hydrateable_files = Client.get_hydrateable_svelte_files(svelte_files);
    // validate hydratable files
    hydrateable_files.map((file) => {
        if (file.config?.loading == WyvrFileLoading.none && !file.config?.trigger) {
            Logger.error(
                Logger.color.dim('[wyvr]'),
                file.rel_path,
                '"trigger" prop is required, when loading is set to none'
            );
        }
        if (file.config?.loading == WyvrFileLoading.media && !file.config?.media) {
            Logger.error(
                Logger.color.dim('[wyvr]'),
                file.rel_path,
                '"media" prop is required, when loading is set to media'
            );
        }
    });
    const transformed_files = Client.transform_hydrateable_svelte_files(hydrateable_files);
    await Plugin.after('transform', transformed_files);
    return {
        src: svelte_files,
        client: transformed_files,
    };
};
