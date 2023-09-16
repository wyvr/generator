import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { LogType } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/get_log_name', () => {
    it('undefined', () => {
        strictEqual(Logger.get_log_name(), '<?>');
    });
    it('unknown type', () => {
        strictEqual(Logger.get_log_name(-1), '<?>');
    });
    it('invalid type', () => {
        strictEqual(Logger.get_log_name('log'), '<?>');
    });
    it('valid type', () => {
        strictEqual(Logger.get_log_name(LogType.info), 'INFO');
    });
    it('valid type, but to short', () => {
        strictEqual(Logger.get_log_name(LogType.log), 'LOG ');
    });
    it('valid type, but to long', () => {
        strictEqual(Logger.get_log_name(LogType.debug), 'DEBU');
    });
});
