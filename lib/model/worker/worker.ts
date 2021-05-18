import { WorkerStatus } from '@lib/model/worker/status';
import { fork } from 'cluster';

export class WorkerModel {
    public status: WorkerStatus = WorkerStatus.undefined;
    public pid: number = 0;
    public process: any = null;
    constructor() {
        const instance = fork();
        this.process = instance.process;
        this.pid = instance.process.pid;
    }
}
