import { Logger } from '@lib/logger';

export const fail = (error: string = null) => {
    Logger.error('failed', error);
    process.exit(1);
    return;
};

export const shutdown = () => {
    Logger.success('shutdown');
    process.exit(0);
    return;
};

export const idle = (wait_for: string = null) => {
    Logger.output(null, Logger.color.dim, '░', `idle & waiting${wait_for ? ` for ${wait_for}` : ''}...`);
    Logger.output(null, null, '');
}