import { join } from 'path';
import { FOLDER_GEN_SERVER } from '../constants/folder.js';
import { Identifier } from '../model/identifier.js';
import { WyvrData } from '../model/wyvr_data.js';
import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { Config } from '../utils/config.js';
import { find_file } from '../utils/file.js';
import { to_server_path } from '../utils/to.js';
import { set_default_values } from '../utils/transform.js';
import { is_null } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { send_action } from '../worker/communication.js';

const identifiers_cache = {};

export function process_page_data(page_data, mtime) {
    if (is_null(page_data)) {
        return undefined;
    }
    const default_values = Config.get('default_values');
    page_data._wyvr = WyvrData(page_data._wyvr, page_data.url, page_data.title, mtime);

    const enhanced_data = set_default_values(page_data, default_values);

    // search template files
    const root_path = join(Cwd.get(), FOLDER_GEN_SERVER);
    const doc_file_name = find_file(join(root_path, 'doc'), page_data._wyvr.template.doc.map(to_server_path));
    const layout_file_name = find_file(join(root_path, 'layout'), page_data._wyvr.template.layout.map(to_server_path));
    const page_file_name = find_file(join(root_path, 'page'), page_data._wyvr.template.page.map(to_server_path));

    enhanced_data._wyvr.template_files.doc = doc_file_name;
    enhanced_data._wyvr.template_files.layout = layout_file_name;
    enhanced_data._wyvr.template_files.page = page_file_name;

    // build identifier
    const identifier_emit = Identifier(doc_file_name, layout_file_name, page_file_name);
    identifier_emit.type = WorkerEmit.identifier;

    const identifier_name = identifier_emit.identifier;

    // emit identifier only when it was not added to the cache before
    // or avoid when the given data has to be static => no JS
    if (!identifiers_cache[identifier_name] && !enhanced_data._wyvr.static) {
        identifiers_cache[identifier_name] = true;
        send_action(WorkerAction.emit, identifier_emit);
    }

    // add the identifier to the wyvr object
    enhanced_data._wyvr.identifier = identifier_name;

    // if (!entry.add_to_global) {
    //     return result.data;
    // }
    // nav_data = Generate.add_to_nav(enhanced_data, nav_data);

    return enhanced_data;
}
/*
function emit_identifier(data) {
    const result = create_data_result(data, this.root_template_paths, (wyvr_data, result, identifier) => {
        // emit identifier only when it was not added to the cache
        // or avoid when the given data has to be static => no JS
        if (!this.identifiers_cache[identifier] && !wyvr_data.static) {
            this.identifiers_cache[identifier] = true;
            WorkerHelper.send_action(WorkerAction.emit, result);
        }
    });

    return result;
}

function create_data_result(data: any, root_template_paths: string[], before_modification: (data: any, result: IIdentifierEmit, identifier: string) => void = null): any => {
    const raw_path = join(Cwd.get(), 'gen', 'raw');
    const doc_file_name = File.find_file(join(raw_path, 'doc'), data._wyvr.template.doc);
    const layout_file_name = File.find_file(join(raw_path, 'layout'), data._wyvr.template.layout);
    const page_file_name = File.find_file(join(raw_path, 'page'), data._wyvr.template.page);

    const identifier = Client.get_identifier_name(root_template_paths, doc_file_name, layout_file_name, page_file_name);
    const result: IIdentifierEmit = {
        type: 'identifier',
        identifier,
        doc: doc_file_name,
        layout: layout_file_name,
        page: page_file_name,
    };

    if (before_modification && typeof before_modification == 'function') {
        before_modification(data, result, identifier);
    }

    // add the identifier to the wyvr object
    data._wyvr.identifier = identifier;
    (<any>result).data = data;

    // correct doc, layout and page from raw to src
    result.doc = result.doc.replace(/gen\/raw/, 'gen/src');
    result.layout = result.layout.replace(/gen\/raw/, 'gen/src');
    result.page = result.page.replace(/gen\/raw/, 'gen/src');
    return result;
};
*/
