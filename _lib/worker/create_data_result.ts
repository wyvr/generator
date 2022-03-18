/* eslint @typescript-eslint/no-explicit-any: 0 */
import { File } from '@lib/file';
import { join } from 'path';
import { Client } from '@lib/client';
import { Cwd } from '@lib/vars/cwd';
import { IIdentifierEmit } from '@lib/interface/identifier';

export const create_data_result = (data: any, root_template_paths: string[], before_modification: (data: any, result: IIdentifierEmit, identifier: string) => void = null): any => {
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
