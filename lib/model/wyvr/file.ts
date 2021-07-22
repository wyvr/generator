import { basename, extname } from 'path';

export class WyvrFile {
    name: string;
    config?: WyvrFileConfig;
    scripts?: string[];
    styles?: string[];
    props?: string[];
    path: string = null;
    constructor(path: string = null) {
        if(path && typeof path == 'string') {
            this.path = path;
        }
        if (this.path) {
            let name = basename(path).replace(new RegExp(`${extname(path).replace('.', '\\.')}$`), '');
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
}
