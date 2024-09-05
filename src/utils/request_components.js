import { FOLDER_GEN_SERVER } from '../constants/folder.js';
import { transform_prop_source } from '../resource/props.js';
import { CodeContext } from '../struc/code_context.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { execute_server_code_from_file, render_server_compiled_svelte } from './compile_svelte.js';
import { exists, read, read_json } from './file.js';
import { is_null } from './validate.js';

export async function render_request_components(path, data) {
    const component_path = path.replace(/\/$/, '.js').replace(/^\/\$request/, Cwd.get(FOLDER_GEN_SERVER));

    // Parse prop files from data
    for (const [prop, value] of Object.entries(data)) {
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
    const component = await execute_server_code_from_file(code, component_path);
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
        css: rendered_result.result?.css?.code ?? ''
    };
}
