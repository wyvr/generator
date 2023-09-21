import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { to_plain } from '../../../src/utils/to.js';
import { WorkerController } from '../../../src/worker/controller.js';

describe('worker/controller/exit', () => {
    let logger_messages = [];

    before(() => {
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            logger_messages.push(to_plain(msg));
        });
    });
    beforeEach(() => {
        WorkerController.workers = [];
    });
    afterEach(() => {
        WorkerController.workers = [];
        logger_messages = [];
    });
    after(() => {
        console.error.restore();
    });
    it('create worker', () => {
        WorkerController.create_workers(1);
        strictEqual(WorkerController.workers.length, 1);
        WorkerController.exit();
        deepStrictEqual(logger_messages, []);
    });
});
