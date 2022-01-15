import { WorkerAction } from '@lib/struc/worker/action';
import { Plugin } from '@lib/plugin';
import { WorkerController } from '@lib/worker/controller';
import { IPerformance_Measure } from '@lib/performance_measure';
import { IObject } from '@lib/interface/object';

export const media = async (perf: IPerformance_Measure, worker_controller: WorkerController, media: IObject): Promise<boolean> => {
    perf.start('media');
    await Plugin.before('media', media);
    const list = Object.values(media);
    const result = await worker_controller.process_in_workers('media', WorkerAction.media, list, 100);
    await Plugin.after('media', result);
    perf.end('media');
    return result;
};
