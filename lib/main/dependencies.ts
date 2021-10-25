import { Dependency } from "../dependency";
import { IPerformance_Measure } from "../performance_measure";
import { join } from "path";
import { File } from "../file";
import { Env } from "../env";

export const dependencies = (perf: IPerformance_Measure, release_path: string, build_pages:any[], shortcode_identifier:any, identifiers: any, package_tree:any) => {
    perf.start('dependencies');
    const dep_source_folder = join(process.cwd(), 'gen', 'raw');
    Dependency.build(dep_source_folder, build_pages, shortcode_identifier);
    if (Env.is_dev()) {
        // build structure based on the identifiers
        Object.keys(identifiers).forEach((id) => {
            const identifier = identifiers[id];
            let structure: any = null;
            if (identifier.doc) {
                structure = Dependency.get_structure(identifier.doc, package_tree);
                structure.layout = Dependency.get_structure(identifier.layout, package_tree);
                structure.layout.page = Dependency.get_structure(identifier.page, package_tree);
            }
            File.write_json(join(release_path, `${id}.json`), structure);
        });
    }
    File.write_json(join('gen', 'dependencies.json'), Dependency.cache);
    File.write_json(join('gen', 'page_dependencies.json'), Dependency.page_cache);

    perf.end('dependencies');
};
