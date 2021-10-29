import { EnvModel } from '@lib/model/env';
import { Route } from '../model/route';

export interface IWorkerSend {
    action: IWorkerSendAction;
    value?: any;
}
export interface IWorkerSendAction {
    key: number | string;
    key_name?: string;
    value: any;
    value_name?: string;
}
// export interface IWorkerValue {}
export interface IWorkerConfigureValue {
    env?: EnvModel;
    cwd?: string;
    release_path?: string;
}
export interface IWorkerRouteValue {
    route: Route;
    add_to_global: boolean,
}
export interface IWorkerOptimizeValue {
    path: string;
    files: string[];
    hash_list: any[];
}
