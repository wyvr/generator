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
    const wyvr_inner = search_wyvr_content(content);
    if (!wyvr_inner) {
        return config;
    }

    // parse the properties
    const rows = wyvr_inner.inner
        .split('\n')
        .map((row) => row.trim())
        .filter(Boolean);

    for (let i = 0, len = rows.length; i < len; i++) {
        const row = rows[i];
        // search string
        const cfg_string = row.match(/(?<key>\w+)\s*?:\s*?['"](?<value>[^'"]*)['"]/)?.groups;
        if (cfg_string) {
            config[cfg_string.key] = cfg_string.value;
            break;
        }
        // search bool
        const cfg_bool = row.match(/(?<key>\w+)\s*?:\s*?(?<value>true|false)/)?.groups;
        if (cfg_bool) {
            config[cfg_bool.key] = cfg_bool.value === 'true';
            break;
        }
        // search number
        const cfg_number = row.match(/(?<key>\w+)\s*?:\s*?(?<value>[\d,.]+)/)?.groups;
        if (cfg_number) {
            config[cfg_number.key] = parseFloat(cfg_number.value);
            break;
        }
        // search conditions
        if (row.match(/condition\s*?:\s*?\(\s*?\)\s*?=>\s*?\{/)) {
            let cur_content = row;
            let inner = search_brackets_content(cur_content).inner;
            while (!inner || i >= len) {
                i++;
                cur_content += '\n' + rows[i];
                inner = search_brackets_content(cur_content).inner;
                if (inner) {
                    config.condition = inner;
                }
            }
        }
    }

    // auto encapsulte media queries
    if (config.media != 'all' && !config.media.match(/\sand\s|\sor\s/)) {
        config.media = `(${config.media})`;
    }
    return config;
}

export function search_wyvr_content(content) {
    // search content inside the script tag
    const script_start = content.indexOf('<script');
    const script_end = content.indexOf('</script>');
    if (script_start === -1 || script_end === -1 || script_start > script_end) {
        return undefined;
    }

    const script_content = content.substr(script_start, script_end - script_start).replace(/<script[^>]*?>/, '');

    // search content inside the wyvr instructions
    const wyvr_index = script_content.indexOf('wyvr');
    if (wyvr_index == -1) {
        return undefined;
    }
    const wyvr_content = script_content.substr(wyvr_index + 4);

    const result = search_brackets_content(wyvr_content);
    if (!result.inner) {
        return undefined;
    }
    // add offset
    result.start += script_start;
    result.end += script_start;
    return result;
}

function search_brackets_content(content) {
    let index = 0;
    let brackets = 0;
    let started = false;
    const result = { start: -1, end: -1, inner: undefined };

    for (const len = content.length; index <= len; index++) {
        let char = content[index];
        if (char == '{') {
            if (!started) {
                result.start = index + 1;
            }
            started = true;
            brackets++;
            continue;
        }
        if (char == '}') {
            brackets--;
            if (started && brackets == 0) {
                result.end = index - 1;
                break;
            }
            continue;
        }
    }
    if (result.start > -1 && result.end > -1) {
        result.inner = content.substr(result.start, result.end - result.start);
    }
    return result;
}
