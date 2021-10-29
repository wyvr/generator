import { WorkerStatus } from '@lib/model/worker/status';
import cluster from 'cluster';
import { ChildProcess } from 'child_process';

export class WorkerModel {
    public status: WorkerStatus = WorkerStatus.undefined;
    public pid = 0;
    public process: ChildProcess = null;
    constructor(custom_fork: () => cluster.Worker = null) {
        const instance: cluster.Worker = custom_fork ? custom_fork() : cluster.fork();
        this.process = instance.process;
        this.pid = instance.process.pid;
    }
}
