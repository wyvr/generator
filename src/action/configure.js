import { WorkerAction } from '../struc/worker_action.js';
import { Config } from '../utils/config.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { Report } from '../vars/report.js';
import { UniqId } from '../vars/uniq_id.js';
import { WyvrPath } from '../vars/wyvr_path.js';
import { WorkerController } from '../worker/controller.js';
import { wait_until_idle } from './wait_until_idle.js';

export async function configure() {
    // wait until all workers are ready
    await wait_until_idle(30);
    const data = get_configure_data();
    WorkerController.workers.forEach((worker) => {
        WorkerController.send_action(worker, WorkerAction.configure, data);
    });
}
export function get_configure_data() {
    return {
        config: Config.get(),
        env: Env.get(),
        cwd: Cwd.get(),
        release_path: ReleasePath.get(),
        wyvr_path: WyvrPath.get(),
        uniq_id: UniqId.get(),
        report: Report.get()
    };
}
