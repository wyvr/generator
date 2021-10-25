import { Logger } from '@lib/logger';

export const shutdown = () => {
    Logger.success('shutdown');
    process.exit(0);
    return;
};
