import { IWorkerConfigureValue } from '@lib/interface/worker';
import { Logger } from '@lib/logger';
import { Env } from '@lib/env';
import { Cwd } from '@lib/vars/cwd';
import { ReleasePath } from '@lib/vars/release_path';
import { RootTemplatePaths } from '@lib/vars/root_template_paths';

export const configure = (config: IWorkerConfigureValue | null) => {
    if (!config) {
        Logger.warning('empty configure value');
        return null;
    }
    // set the config of the worker by the main process
    Env.set(config?.env);
    Cwd.set(config?.cwd);
    ReleasePath.set(config?.release_path);
    // only when everything is configured set the worker idle
    if (Env.get() == null || Cwd.get() == null || ReleasePath.get() == null) {
        Logger.warning('invalid configure value', config);
        return null;
    }
    return { root_template_paths: RootTemplatePaths.get() };
};
