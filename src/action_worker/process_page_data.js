import { join } from 'node:path';
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
import { Env } from '../vars/env.js';
import { Logger } from '../utils/logger.js';

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
        // @obsolete handle the obsolete _wyvr property
        const found_obsolete_wyvr = !!page_data._wyvr;
        if (found_obsolete_wyvr) {
            Logger.warning('obsolete _wyvr property in', page_data.url);
            page_data.$wyvr = page_data._wyvr;
        }
        page_data.$wyvr = WyvrData(page_data.$wyvr, page_data.url, page_data.title, mtime);

        const enhanced_data = set_default_values(page_data, default_values);

        // search template files
        const root_path = Cwd.get(FOLDER_GEN_SERVER);
        const doc_file_name = find_file(join(root_path, 'doc'), page_data.$wyvr.template.doc.map(to_server_path));
        const layout_file_name = find_file(join(root_path, 'layout'), page_data.$wyvr.template.layout.map(to_server_path));
        const page_file_name = find_file(join(root_path, 'page'), page_data.$wyvr.template.page.map(to_server_path));

        // build identifier
        const identifier = Identifier(doc_file_name, layout_file_name, page_file_name);

        enhanced_data.$wyvr = {
            ...enhanced_data.$wyvr,
            template_files: {
                doc: doc_file_name,
                layout: layout_file_name,
                page: page_file_name
            },
            // add the identifier to the wyvr object

            identifier: identifier.identifier,
            identifier_data: identifier
        };

        enhanced_data.isProd = Env.is_prod();

        // move the obsolete _wyvr property back to avoid catastrophic breaking changes
        return enhanced_data;
    });
    return data.result;
}
