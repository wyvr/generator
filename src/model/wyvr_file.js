import { extname, join, sep } from 'path';
import { FOLDER_GEN } from '../constants/folder.js';
import { RESERVED_KEYWORDS } from '../constants/keywords.js';
import { WyvrFileConfig } from '../struc/wyvr_file.js';
import { filled_string } from '../utils/validate.js';

export function WyvrFile(path) {
    let name = '',
        rel_path = '';
    if (filled_string(path)) {
        const splitted = path.split(sep);
        const gen_index = splitted.indexOf(FOLDER_GEN);
        // make name unique per file, which is based on the path
        // remove the gen and next (state) folder
        const rel_splitts = gen_index > -1 ? splitted.slice(gen_index + 2) : splitted;
        rel_path = join('@src', ...rel_splitts);
        name = rel_splitts.join('_').replace(new RegExp(`${extname(path).replace('.', '\\.')}$`), '');
        // avoid reserved keywords
        if (RESERVED_KEYWORDS.indexOf(name.toLowerCase()) > -1) {
            name = `_${name}`;
        }
    } else {
        path = undefined;
    }

    return {
        name,
        path,
        config: WyvrFileConfig,
        scripts: undefined,
        styles: undefined,
        props: undefined,
        rel_path,
        from_lazy: undefined,
    };
}
