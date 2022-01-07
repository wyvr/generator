import { EnvModel } from '@lib/model/env';
import { Route } from '../model/route';

export interface IWorkerSend {
    action: IWorkerSendAction;
    /* eslint-disable */
    value?: any;
    /* eslint-enable */
}
export interface IWorkerSendAction {
    key: number | string;
    key_name?: string;
    /* eslint-disable */
    value: any;
    /* eslint-enable */
    value_name?: string;
}
// export interface IWorkerValue {}
export interface IWorkerConfigureValue {
    env?: EnvModel;
    cwd?: string;
    release_path?: string;
    socket_port?: number;
}
export interface IWorkerRouteValue {
    route: Route;
    add_to_global: boolean;
}
export interface IWorkerOptimizeValue {
    path: string;
    files: string[];
    hash_list: IWorkerOptimizeHashEntry[];
}
export interface IWorkerOptimizeHashEntry {
    before: string;
    after: string;
}
export interface IWorkerControllerConfig {
    socket_port?: number;
}
