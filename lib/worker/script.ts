/* eslint @typescript-eslint/no-explicit-any: 0 */

import { Client } from '@lib/client';
import { Dependency } from '@lib/dependency';
import { Error } from '@lib/error';
import { File } from '@lib/file';
import { Logger } from '@lib/logger';
import { WyvrFile } from '@lib/model/wyvr/file';
import { IIdentifier } from '@lib/interface/identifier';
import { hrtime_to_ms } from '@lib/converter/time';

export const script = async (value: IIdentifier[]) => {
    const svelte_files = File.collect_svelte_files('gen/client');
    // get all svelte components which should be hydrated
    const files = Client.get_hydrateable_svelte_files(svelte_files);

    const identifier_list = [];
    const len = value.length;

    for (let index = 0; index < len; index++) {
        const identifier = value[index];
        const result = await build_identifier_script(identifier, files);
        if(result) {
            identifier_list.push(result);
        }
    }
    return identifier_list;
};
export const build_identifier_script = async (identifier: IIdentifier, files: WyvrFile[]) => {
    const start = process.hrtime();
    let dep_files = [];
    ['doc', 'layout', 'page'].forEach((type) => {
        if (identifier.file[type]) {
            dep_files.push(...Dependency.get_dependencies(identifier.file[type], files, identifier.dependency));
        }
    });
    if (identifier.file.shortcodes) {
        dep_files.push(...Dependency.get_dependencies(identifier.file.name, files, identifier.dependency));
    }
    // remove doubled dependency entries
    dep_files = dep_files.filter((wyvr_file: WyvrFile, index) => {
        return index == dep_files.findIndex((dep_file: WyvrFile) => dep_file.path == wyvr_file.path);
    });
    try {
        // console.log(identifier.file.name, identifier.dependency, dep_files);
        const [error, result] = await Client.create_bundle(identifier.file, dep_files);
        if (error) {
            Logger.error(Error.get({ message: error }, identifier.file.name, 'build identifier script'));
        }
        Logger.report(hrtime_to_ms(process.hrtime(start)), 'script', identifier.file.name);
        return result;
    } catch (e) {
        // svelte error messages
        Logger.error(Error.get(e, identifier.file.name, 'build identifier script'));
    }
    return null;
};
