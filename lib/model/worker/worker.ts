import { WorkerStatus } from '@lib/model/worker/status';
import cluster from 'cluster';

export class WorkerModel {
    public status: WorkerStatus = WorkerStatus.undefined;
    public pid = 0;
    public process: any = null;
    constructor(custom_fork: Function = null) {
        const instance = custom_fork ? custom_fork() : cluster.fork();
        this.process = instance.process;
        this.pid = instance.process.pid;
    }
}
