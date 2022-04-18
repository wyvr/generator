import { deepStrictEqual } from 'assert';
import cluster from 'cluster';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { LogColor, LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { Report } from '../../../src/vars/report.js';
import Sinon from 'sinon';


describe('utils/logger/report', () => {
    let log, err;
    let result = [];

    const icon = LogColor.report(LogIcon.report);
    const color = LogColor.report;


    before(() => {
        Sinon.stub(Logger, 'output');
        Logger.output.callsFake((...msg) => {
            logger_messages.push(msg.slice(3));
        });
    });
    after(() => {
        Logger.output.restore();
    });

    before(() => {
        // runs once before the first test in this block
        log = console.log;
        console.log = (...args) => {
            result.push(args);
        };
        err = console.error;
        console.error = (...args) => {
            result.push(args);
        };
    });
    beforeEach(() => {
        Report.set(true);
    });
    afterEach(() => {
        result = [];
        Report.set(false);
        Logger.report_content = [];
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
        console.error = err;
    });
    it('hide', () => {
        Report.set(false);
        Logger.report('#');
        deepStrictEqual(result, []);
    });
    it('undefined', () => {
        Logger.report();
        deepStrictEqual(result, []);
    });

    it('key + multiple text', () => {
        Logger.report(500, 'a', 'b');
        deepStrictEqual(result, [[icon, color(`a b 500 ${kleur.dim('ms')}`)]]);
        deepStrictEqual(Logger.report_content, [[500, 'a', 'b']]);
    });
    it('report from worker', () => {
        const sandbox = Sinon.createSandbox();
        sandbox.stub(cluster, 'isWorker').value(true);
        Logger.report(500, 'a', 'b');
        deepStrictEqual(result, [[icon, color(`a b 500 ${kleur.dim('ms')}`)]]);
        deepStrictEqual(Logger.report_content, []);
        sandbox.restore();
    });
    it('from worker', () => {
        
        Logger.report(500, 'a', 'b');
        deepStrictEqual(result, [[icon, color(`a b 500 ${kleur.dim('ms')}`)]]);
    });
});
