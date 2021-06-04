import { basename, extname } from 'path';

export class WyvrFile {
    name: string;
    config?: WyvrFileConfig;
    scripts?: string[];
    styles?: string[];
    props?: string[];
    constructor(public path: string) {
        if (path) {
            this.name = basename(path).replace(new RegExp(`${extname(path).replace('.', '\\.')}$`), '');
        }
    }
}
export class WyvrFileConfig {
    display: WyvrHydrateDisplay = WyvrHydrateDisplay.block;
    render: WyvrFileRender = WyvrFileRender.static;
    error: any;
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
