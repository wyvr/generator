export const unknown_command = async (config) => {
    return `unknown command ${config.cli.command.join(' ')}`;
};
