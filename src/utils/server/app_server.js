import { Logger } from './../logger.js';
import { get_error_message } from './../error.js';
import { generate_server } from './generate_server.js';

// @NOTE: will be started in the workers
export async function app_server(port) {
    return new Promise((resolve, reject) => {
        generate_server(port, false, undefined, false).catch((e) => {
            Logger.error(get_error_message(e, undefined, `worker error ${process.pid}`));
            reject();
        });
    });
}
