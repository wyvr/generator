import { Logger } from '../utils/logger';

export async function create_command(config) {
    const type = config.version//undefined;
    // if (config.cli.command.length < 2) {
    //     // prompt for type
    // } else {
    //     type = config.cli.command[2];
    // }
    Logger.improve(type);
    // console.log(type)
    return type;
}
