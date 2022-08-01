import { join } from 'path';
import { FOLDER_CSS, FOLDER_GEN_JS, FOLDER_JS } from '../constants/folder.js';
import { get_exec, run_exec } from '../utils/exec.js';
import { copy, exists, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { filled_string } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { scripts } from './script.js';

export async function exec_request(req, res, uid, force_generating_of_resources) {
    const exec = get_exec(req.url);
    if (exec) {
        Logger.debug('exec', req.url, exec.url);
        const result = await run_exec(req, res, uid, exec);
        // write css
        if (filled_string(result?.data?._wyvr?.identifier) && result?.result?.css?.code) {
            const css_file_path = join(ReleasePath.get(), FOLDER_CSS, `${result.data._wyvr.identifier}.css`);
            if (!exists(css_file_path) || force_generating_of_resources) {
                write(css_file_path, result.result.css.code);
            }
        }
        const js_path = join(ReleasePath.get(), FOLDER_JS, `${result.data._wyvr.identifier}.js`);
        if (result?.data?._wyvr?.identifier_data && (!exists(js_path) || force_generating_of_resources)) {
            const identifiers = [result?.data?._wyvr?.identifier_data];
            // save the file to gen
            await scripts(identifiers);
            copy(Cwd.get(FOLDER_GEN_JS, `${result.data._wyvr.identifier}.js`), js_path);
        }
        if (result?.result?.html) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(result.result.html);
            return true;
        }
    }
    return false;
}
