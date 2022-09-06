import { join } from 'path';
import { FOLDER_CSS, FOLDER_GEN_EXEC, FOLDER_GEN_JS, FOLDER_JS } from '../constants/folder.js';
import { get_config_cache } from '../utils/config_cache.js';
import { extract_exec_config, get_exec, load_exec, run_exec } from '../utils/exec.js';
import { copy, exists, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { send_content, send_head } from '../utils/server.js';
import { filled_string } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { scripts } from './script.js';

let exec_cache;
export async function exec_request(req, res, uid, force_generating_of_resources) {
    if (!exec_cache) {
        exec_cache = get_config_cache('exec.cache');
    }
    const exec = get_exec(req.url, req.method, exec_cache);
    if (exec) {
        Logger.debug('exec', req.url, exec.url);
        return await process_exec_request(req, res, uid, exec, force_generating_of_resources);
    }
    return false;
}

let fallback_exec_cache;
export async function fallback_exec_request(req, res, uid) {
    if (!fallback_exec_cache) {
        const fallback_file = Cwd.get(FOLDER_GEN_EXEC, '_fallback.js');
        if (!exists(fallback_file)) {
            return false;
        }
        const result = await load_exec(fallback_file);
        fallback_exec_cache = extract_exec_config(result, fallback_file);
        fallback_exec_cache.match = '.*';
    }
    return await process_exec_request(req, res, uid, fallback_exec_cache, false);
}

export async function process_exec_request(req, res, uid, exec, force_generating_of_resources) {
    const result = await run_exec(req, res, uid, exec);
    // write css
    if (filled_string(result?.data?._wyvr?.identifier) && result?.result?.css?.code) {
        const css_file_path = join(ReleasePath.get(), FOLDER_CSS, `${result.data._wyvr.identifier}.css`);
        if (!exists(css_file_path) || force_generating_of_resources) {
            write(css_file_path, result.result.css.code);
        }
    }
    const js_path = join(ReleasePath.get(), FOLDER_JS, `${result?.data?._wyvr?.identifier || 'default'}.js`);
    if (result?.data?._wyvr?.identifier_data && (!exists(js_path) || force_generating_of_resources)) {
        // script only accepts an object
        const identifiers = {};
        identifiers[result.data._wyvr.identifier_data.identifier] = result?.data._wyvr.identifier_data;
        // save the file to gen
        await scripts(identifiers);
        copy(Cwd.get(FOLDER_GEN_JS, `${result.data._wyvr.identifier}.js`), js_path);
    }
    if (result?.result?.html && !res.writableEnded) {
        send_head(res, 200, 'text/html');
        send_content(res, result.result.html);
        return true;
    }
}