import { extname, join, sep } from 'path';
import { FOLDER_GEN, FOLDER_SRC } from '../constants/folder.js';
import { RESERVED_KEYWORDS } from '../constants/keywords.js';
import { WyvrFileConfig } from '../struc/wyvr_file.js';
import { clone } from '../utils/json.js';
import { filled_string, in_array } from '../utils/validate.js';

export function WyvrFile(path) {
    let name = '',
        rel_path = '';
    if (filled_string(path)) {
        const splitted = path.split(sep);
        const gen_index = splitted.indexOf(FOLDER_GEN);
        // make name unique per file, which is based on the path
        // remove the gen and next (state) folder
        let rel_splitts = splitted;
        if (gen_index > -1) {
            rel_splitts = splitted.slice(gen_index + 2);
        }
        const src_index = rel_splitts.indexOf(FOLDER_SRC);
        if (src_index > -1) {
            rel_splitts = rel_splitts.slice(src_index + 1);
        }
        rel_path = join('@src', ...rel_splitts);
        name = rel_splitts.join('_').replace(new RegExp(`${extname(path).replace('.', '\\.')}$`), '');
        // avoid reserved keywords
        if (in_array(RESERVED_KEYWORDS, name.toLowerCase())) {
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
    if (!filled_string(content)) {
        return config;
    }
    const rows = content.match(/wyvr:\s*?(?<rows>\{[^}]*\})/)?.groups?.rows;
    if (rows) {
        rows.split('\n').forEach((row) => {
            // search string
            const cfg_string = row.match(/(?<key>\w+):\s*?['"](?<value>[^'"]*)['"]/)?.groups;
            if (cfg_string) {
                config[cfg_string.key] = cfg_string.value;
                return;
            }
            // search bool
            const cfg_bool = row.match(/(?<key>\w+):\s*?(?<value>true|false)/)?.groups;
            if (cfg_bool) {
                config[cfg_bool.key] = cfg_bool.value === 'true';
                return;
            }
            // search number
            const cfg_number = row.match(/(?<key>\w+):\s*?(?<value>[\d,.]+)/)?.groups;
            if (cfg_number) {
                config[cfg_number.key] = parseFloat(cfg_number.value);
                return;
            }
        });
    }
    // auto encapsulte media queries
    if (config.media != 'all' && !config.media.match(/\sand\s|\sor\s/)) {
        config.media = `(${config.media})`;
    }
    return config;
}
