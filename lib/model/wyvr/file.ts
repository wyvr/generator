import { basename, extname, sep } from 'path';

export class WyvrFile {
    name: string;
    config?: WyvrFileConfig;
    scripts?: string[];
    styles?: string[];
    props?: string[];
    path: string = null;
    rel_path: string = null;
    constructor(path: string = null) {
        if (path && typeof path == 'string') {
            this.path = path;
        }
        if (this.path) {
            const splitted = path.split(sep);
            const gen_index = splitted.indexOf('gen');
            // make name unique per file, which is based on the path
            // remove the gen and next (state) folder
            const rel_splitts = splitted.slice(gen_index + 2);
            this.rel_path = ['@src', ...rel_splitts].join(sep);
            let name = rel_splitts.join('_').replace(new RegExp(`${extname(path).replace('.', '\\.')}$`), '');
            // avoid reserved keywords
            if (
                [
                    'abstract',
                    'arguments',
                    'await',
                    'boolean',
                    'break',
                    'byte',
                    'case',
                    'catch',
                    'char',
                    'class',
                    'const',
                    'continue',
                    'debugger',
                    'default',
                    'delete',
                    'do',
                    'double',
                    'else',
                    'enum',
                    'eval',
                    'export',
                    'extends',
                    'false',
                    'final',
                    'finally',
                    'float',
                    'for',
                    'function',
                    'goto',
                    'if',
                    'implements',
                    'import',
                    'in',
                    'instanceof',
                    'int',
                    'interface',
                    'let',
                    'long',
                    'native',
                    'new',
                    'null',
                    'package',
                    'private',
                    'protected',
                    'public',
                    'return',
                    'short',
                    'static',
                    'super',
                    'switch',
                    'synchronized',
                    'this',
                    'throw',
                    'throws',
                    'transient',
                    'true',
                    'try',
                    'typeof',
                    'var',
                    'void',
                    'volatile',
                    'while',
                    'with',
                    'yield',
                ].indexOf(name.toLowerCase()) > -1
            ) {
                name = `_${name}`;
            }
            this.name = name;
        }
    }
}
export class WyvrFileConfig {
    display: WyvrHydrateDisplay = WyvrHydrateDisplay.block;
    render: WyvrFileRender = WyvrFileRender.static;
    loading: WyvrFileLoading = WyvrFileLoading.instant;
    error: any;
    portal: string;
    media: string = 'all';
    [key: string]: any;
}
export enum WyvrHydrateDisplay {
    inline = 'inline',
    block = 'block',
}
export enum WyvrFileRender {
    static = 'static',
    hydrate = 'hydrate',
}
export enum WyvrFileLoading {
    instant = 'instant',
    lazy = 'lazy',
    idle = 'idle',
    media = 'media',
}
export class WyvrCssMediaCollection {
    [key: string]: string
}