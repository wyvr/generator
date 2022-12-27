import { join } from 'path';
import { FOLDER_GEN_SERVER } from '../constants/folder.js';
import { Identifier } from '../model/identifier.js';
import { WyvrData } from '../model/wyvr_data.js';
import { Config } from '../utils/config.js';
import { find_file } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { to_server_path } from '../utils/to.js';
import { set_default_values } from '../utils/transform.js';
import { is_null } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';

export async function process_page_data(page_data, mtime) {
    if (is_null(page_data)) {
        return undefined;
    }

    // if (!entry.add_to_global) {
    //     return result.data;
    // }
    // nav_data = Generate.add_to_nav(enhanced_data, nav_data);

    const plugin = await Plugin.process('process_page_data', page_data, mtime);
    const data = await plugin((page_data, mtime) => {
        const default_values = Config.get('default_values');
        page_data._wyvr = WyvrData(page_data._wyvr, page_data.url, page_data.title, mtime);

        const enhanced_data = set_default_values(page_data, default_values);

        // search template files
        const root_path = Cwd.get(FOLDER_GEN_SERVER);
        const doc_file_name = find_file(join(root_path, 'doc'), page_data._wyvr.template.doc.map(to_server_path));
        const layout_file_name = find_file(
            join(root_path, 'layout'),
            page_data._wyvr.template.layout.map(to_server_path)
        );
        const page_file_name = find_file(join(root_path, 'page'), page_data._wyvr.template.page.map(to_server_path));

        enhanced_data._wyvr.template_files.doc = doc_file_name;
        enhanced_data._wyvr.template_files.layout = layout_file_name;
        enhanced_data._wyvr.template_files.page = page_file_name;

        // build identifier
        const identifier = Identifier(doc_file_name, layout_file_name, page_file_name);

        // add the identifier to the wyvr object
        enhanced_data._wyvr.identifier = identifier.identifier;
        enhanced_data._wyvr.identifier_data = identifier;
        return enhanced_data;
    });

    return data.result;
}
