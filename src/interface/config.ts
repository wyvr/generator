import { IObject } from '@lib/interface/object';

export interface IConfig {
    cli: ICliConfig;
    pkg: IObject;
}
export interface ICliConfig {
    cwd: string;
    interpreter: string;
    script: string;
    command: string[];
    flags: IObject;
}
