import { Dependency } from '@lib/dependency';
import { IPerformance_Measure } from '@lib/performance_measure';
import { join } from 'path';
import { File } from '@lib/file';
import { Env } from '@lib/env';
import { ReleasePath } from '@lib/vars/release_path';
import { IObject } from '@lib/interface/object';
import { IPackageTree } from '@lib/interface/package_tree';
import { IIdentifierDependency } from '@lib/interface/identifier';

export const dependencies = (perf: IPerformance_Measure, build_pages: IIdentifierDependency[], shortcode_identifier: IObject, identifiers: IObject, package_tree: IPackageTree) => {
    perf.start('dependencies');
    const dep_source_folder = join(process.cwd(), 'gen', 'raw');
    Dependency.build(dep_source_folder, build_pages, shortcode_identifier);
    if (Env.is_dev()) {
        // build structure based on the identifiers
        Object.keys(identifiers).forEach((id) => {
            const identifier = identifiers[id];
            let structure: IObject = null;
            if (identifier.doc) {
                structure = Dependency.get_structure(identifier.doc, package_tree);
                structure.layout = Dependency.get_structure(identifier.layout, package_tree);
                structure.layout.page = Dependency.get_structure(identifier.page, package_tree);
            }
            File.write_json(join(ReleasePath.get(), `${id}.json`), structure, false);
        });
    }
    File.write_json(join('gen', 'dependencies.json'), Dependency.cache);
    File.write_json(join('gen', 'page_dependencies.json'), Dependency.page_cache);

    perf.end('dependencies');
};
