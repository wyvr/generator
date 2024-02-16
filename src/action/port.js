import { Logger } from '../utils/logger.js';
import { find_port } from '../utils/port.js';

export async function get_ports(config) {
    const port = await find_port(config?.cli?.flags?.port || 3000);
    const wsport = await find_port(config?.cli?.flags?.wsport || 3001);
    if (config?.cli?.flags?.port && config.cli.flags.port != port) {
        Logger.warning('can not use the given port', config.cli.flags.port, 'using', port, 'instead');
    }
    if (config?.cli?.flags?.wsport && config.cli.flags.wsport != wsport) {
        Logger.warning('can not use the given wsport', config.cli.flags.wsport, 'using', wsport, 'instead');
    }
    return { port, wsport };
}
