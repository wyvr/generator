import { Logger } from '@lib/logger';

export const fail = (error: any = null) => {
    Logger.error('failed', error);
    process.exit(1);
};
