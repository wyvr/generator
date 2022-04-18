import { deepStrictEqual } from 'assert';
import cluster from 'cluster';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { LogColor, LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { Report } from '../../../src/vars/report.js';

describe('utils/logger/report', () => {
    let logger_messages = [];

    const icon = LogColor.report(LogIcon.report);
    const color = LogColor.report;

    before(() => {
        Sinon.stub(Logger, 'output');
        Logger.output.callsFake((...msg) => {
            logger_messages.push(msg.slice(3));
        });
    });
    beforeEach(() => {
        Report.set(true);
    });
    after(() => {
        Logger.output.restore();
    });
    afterEach(() => {
        Report.set(false);
        Logger.report_content = [];
        logger_messages = [];
    });

    it('hide', () => {
        Report.set(false);
        Logger.report('#');
        deepStrictEqual(logger_messages, []);
    });
    it('undefined', () => {
        Logger.report();
        deepStrictEqual(logger_messages, []);
    });

    it('key + multiple text', () => {
        Logger.report(500, 'a', 'b');
        deepStrictEqual(logger_messages, [['a', 'b', '500', kleur.dim('ms')]]);
        deepStrictEqual(Logger.report_content, [[500, 'a', 'b']]);
    });
    it('report from worker', () => {
        const sandbox = Sinon.createSandbox();
        sandbox.stub(cluster, 'isWorker').value(true);
        Logger.report(500, 'a', 'b');
        deepStrictEqual(logger_messages, [['a', 'b', '500', kleur.dim('ms')]]);
        deepStrictEqual(Logger.report_content, []);
        sandbox.restore();
    });
    it('from worker', () => {
        Logger.report(500, 'a', 'b');
        deepStrictEqual(logger_messages, [['a', 'b', '500', kleur.dim('ms')]]);
    });
});
