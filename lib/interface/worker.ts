export interface IWorkerSend {
    action: IWorkerSendAction;
}
export interface IWorkerSendAction {
    key: number | string;
    key_name?: string;
    value: any;
    value_name?: string;
}
