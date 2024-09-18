import { FOLDER_GEN_SERVER } from '../constants/folder.js';
import { Dependency } from '../model/dependency.js';
import { transform_prop_source } from '../resource/props.js';
import { CodeContext } from '../struc/code_context.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { WyvrFileClassification } from '../vars/wyvr_file_classification.js';
import { execute_server_code_from_file, render_server_compiled_svelte } from './compile_svelte.js';
import { exists, read, read_json } from './file.js';
import { Logger } from './logger.js';
import { is_null } from './validate.js';

export async function render_request_components(path, data) {
    // check if the file is allowed to be rendered as component
    const rel_path = path.replace(/\/$/, '.svelte').replace(/^\/\$request/, 'src');
    const dep = new Dependency();
    const file = dep.get_file(rel_path);
    if (!file) {
        Logger.error('file', rel_path, 'could not be found from path', path);
        return undefined;
    }
    if (!WyvrFileClassification.is_server_request(file.standalone)) {
        Logger.error('file', rel_path, 'is not allowed to be rendered, render:', file.standalone, 'from path', path);
        return undefined;
    }

    const component_path = path.replace(/\/$/, '.js').replace(/^\/\$request/, Cwd.get(FOLDER_GEN_SERVER));

    // Parse prop files from data
    for (const [prop, value] of Object.entries(data)) {
        // slots are not allowed on the server
        if (prop === '$$slots') {
            continue;
        }
        const url = transform_prop_source(value);
        if (url) {
            data[prop] = read_json(ReleasePath.get(url));
        }
    }
    if (!exists(component_path)) {
        return undefined;
    }
    const code = read(component_path);
    if (!code) {
        return undefined;
    }
    const component = await execute_server_code_from_file(code, component_path, CodeContext.request);
    if (is_null(component)) {
        return undefined;
    }

    const rendered_result = await render_server_compiled_svelte(
        {
            compiled: undefined,
            component,
            result: true
        },
        data ?? {},
        component_path,
        CodeContext.request
    );

    if (!rendered_result) {
        return undefined;
    }

    return {
        html: rendered_result.result?.html ?? '',
        css: rendered_result.result?.css?.code ?? '',
        head: rendered_result.result?.head ?? ''
    };
}
