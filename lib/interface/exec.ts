import { IncomingMessage } from 'http';
import { WyvrFileConfig } from '@lib/model/wyvr/file';
import { IObject } from '@lib/interface/object';

export interface IExec {
    _wyvr: WyvrFileConfig;
    url: string | string[];
    onExec: (req: IncomingMessage, params: IObject) => Promise<IObject>;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    [key: string]: any;
    /* eslint-enable @typescript-eslint/no-explicit-any */
}

export interface IExecConfig{
    url: string,
    file: string,
    params: string[],
    match: string
  }
  