import { IObject } from '@lib/interface/object';

export interface IConfig {
    cli: ICliConfig;
    version: string;
}
export interface ICliConfig {
    cwd: string;
    interpreter: string;
    script: string;
    command: string[];
    flags: IObject;
}
