import { match } from 'assert';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/get_time_stamp', () => {
    it('ensure timestamp format', () => {
        match(Logger.get_time_stamp(), /\b\d{2}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\b/);
    });
});
