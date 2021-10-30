import { WyvrFileConfig } from '@lib/model/wyvr/file';
import { IObject } from '@lib/interface/object';

export interface IBuildFileResult {
    path: string;
    filename: string;
    doc: string | string[];
    layout: string | string[];
    page: string | string[];
    identifier: IObject;
    _wyvr: WyvrFileConfig;
}

export interface IBuildResult {
    compiled: IObject;
    component: IObject;
    result: IObject;
    notes: IObject[];
}
