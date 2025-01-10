import { Logger } from '../utils/logger.js';
import { find_port } from '../utils/port.js';

export async function get_ports(config) {
    const port = await find_port(config?.cli?.flags?.port || 3000);
    if (config?.cli?.flags?.port && config.cli.flags.port !== port) {
        Logger.warning('can not use the given port', config.cli.flags.port, 'using', port, 'instead');
    }

    return { port };
}
