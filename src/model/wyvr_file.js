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
    // search content inside the script tag
    const script_start = content.indexOf('<script');
    const script_end = content.indexOf('</script>');
    if (script_start === -1 || script_end === -1 || script_start > script_end) {
        return config;
    }

    const script_content = content.substr(script_start, script_end - script_start).replace(/<script[^>]*?>/, '');

    // search content inside the wyvr instructions
    const wyvr_index = script_content.indexOf('wyvr');
    if (wyvr_index == -1) {
        return config;
    }
    const wyvr_content = script_content.substr(wyvr_index + 4);

    let index = 0;
    let brackets = 0;
    let started = false;
    const wyvr_inner_indexes = { start: -1, end: -1 };

    for (const len = wyvr_content.length; index <= len; index++) {
        let char = wyvr_content[index];
        if (char == '{') {
            if (!started) {
                wyvr_inner_indexes.start = index + 1;
            }
            started = true;
            brackets++;
            continue;
        }
        if (char == '}') {
            brackets--;
            if (started && brackets == 0) {
                wyvr_inner_indexes.end = index - 1;
                break;
            }
            continue;
        }
    }
    if (wyvr_inner_indexes.start == -1 || wyvr_inner_indexes.end == -1) {
        return config;
    }

    const wyvr_inner = wyvr_content.substr(wyvr_inner_indexes.start, wyvr_inner_indexes.end - wyvr_inner_indexes.start);

    // parse the properties
    wyvr_inner
        .split('\n')
        .map((row) => row.trim())
        .filter(Boolean)
        .forEach((row) => {
            // search string
            const cfg_string = row.match(/(?<key>\w+)\s*?:\s*?['"](?<value>[^'"]*)['"]/)?.groups;
            if (cfg_string) {
                config[cfg_string.key] = cfg_string.value;
                return;
            }
            // search bool
            const cfg_bool = row.match(/(?<key>\w+)\s*?:\s*?(?<value>true|false)/)?.groups;
            if (cfg_bool) {
                config[cfg_bool.key] = cfg_bool.value === 'true';
                return;
            }
            // search number
            const cfg_number = row.match(/(?<key>\w+)\s*?:\s*?(?<value>[\d,.]+)/)?.groups;
            if (cfg_number) {
                config[cfg_number.key] = parseFloat(cfg_number.value);
                return;
            }
        });

    // auto encapsulte media queries
    if (config.media != 'all' && !config.media.match(/\sand\s|\sor\s/)) {
        config.media = `(${config.media})`;
    }
    return config;
}
