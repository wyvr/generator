export interface IConfig {
    cli: ICliConfig;
}
export interface ICliConfig {
    cwd: string;
    interpreter: string;
    script: string;
    command: string[];
    flags: IObject;
}
