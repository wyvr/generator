import { extname, join, sep } from 'path';
import { FOLDER_GEN } from '../constants/folder.js';
import { RESERVED_KEYWORDS } from '../constants/keywords.js';
import { WyvrFileConfig } from '../struc/wyvr_file.js';
import { clone } from '../utils/json.js';
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

export function extract_wyvr_file_config(content) {
    const config = clone(WyvrFileConfig);
    if(!filled_string(content)) {
        return config;
    }
    const match = content.match(/wyvr:\s*?(\{[^}]*\})/);
    if (match) {
        match[1].split('\n').forEach((row) => {
            // search string
            const cfg_string = row.match(/(\w+):\s*?['"]([^'"]*)['"]/);
            if (cfg_string) {
                config[cfg_string[1]] = cfg_string[2];
                return;
            }
            // search bool
            const cfg_bool = row.match(/(\w+):\s*?(true|false)/);
            if (cfg_bool) {
                config[cfg_bool[1]] = cfg_bool[2] === 'true';
                return;
            }
            // search number
            const cfg_number = row.match(/(\w+):\s*?([\d,.]+)/);
            if (cfg_number) {
                config[cfg_number[1]] = parseFloat(cfg_number[2]);
                return;
            }
        });
    }
    return config;
}