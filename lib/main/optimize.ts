import { Env } from "../env";
import { Logger } from "../logger";
import { WorkerAction } from "../model/worker/action";
import { Optimize } from "../optimize";
import { Plugin } from "../plugin";
import { WorkerController } from "../worker/controller";
import { fail } from "../helper/endings";

export const optimize = async (identifier_list: any[], worker_controller: WorkerController) => {
    if (Env.is_dev()) {
        Logger.improve('optimize will not be executed in dev mode');
        return;
    }
    // add contenthash to the generated files
    const replace_hash_files = [];
    const [hash_list, file_list] = Optimize.get_hashed_files();
    // replace in the files itself
    Optimize.replace_hashed_files_in_files(file_list, hash_list);

    const [error_before, config_before, identifier_list_before, replace_hash_files_before] = await Plugin.before('optimize', identifier_list, replace_hash_files);
    if (error_before) {
        fail(error_before);
    }
    // create the list of files with there hashed identifier elements css/js
    const indexed = {};
    identifier_list_before.forEach((entry) => {
        if (!indexed[entry.identifier]) {
            indexed[entry.identifier] = entry;
            indexed[entry.identifier].files = [];
            indexed[entry.identifier].hash_list = hash_list;
        }
        indexed[entry.identifier].files.push(entry.path);
    });
    const list = Object.keys(indexed).map((key) => indexed[key]);

    const result = await worker_controller.process_in_workers('optimize', WorkerAction.optimize, list, 1);

    const [error_after, config_after, list_after] = await Plugin.after('optimize', list);
    if (error_after) {
        fail(error_after);
    }
    return result;
};
