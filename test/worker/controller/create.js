import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WorkerController } from '../../../src/worker/controller.js';

describe('worker/controller/create', () => {
    beforeEach(() => {
        WorkerController.workers = [];
    });
    afterEach(() => {
        WorkerController.workers = [];
    });
    
});
