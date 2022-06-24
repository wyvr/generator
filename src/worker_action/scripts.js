import { Config } from '../utils/config.js';
import { get_dependencies } from '../utils/dependency.js';
import { to_extension } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { filled_array } from '../utils/validate.js';

export async function scripts(identifiers) {
    if (!filled_array(identifiers)) {
        return;
    }

    for (const identifier of identifiers) {
        const tree = Config.get('dependencies.top');
        const dependencies = [];
        ['doc', 'layout', 'page'].forEach((type) => {
            dependencies.push(...get_dependencies(tree, `${type}/${to_extension(identifier[type], 'svelte')}`));
        });
        Logger.info('identifier', identifier, dependencies);
    }
}
