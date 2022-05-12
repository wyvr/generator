import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { Queue } from '../../../src/model/queue.js';
import { WorkerAction } from '../../../src/struc/worker_action.js';
import { WorkerStatus } from '../../../src/struc/worker_status.js';
import { Event } from '../../../src/utils/event.js';
import { WorkerController } from '../../../src/worker/controller.js';

describe('worker/controller/process_in_workers', () => {
    let logger_messages = [];
    let exit_code;
    let sandbox;
    let send_data = [];

    before(() => {
        sandbox = Sinon.createSandbox();
        sandbox.stub(process, 'exit');
        process.exit.callsFake((code) => {
            exit_code = code;
        });
        sandbox.stub(console, 'error');
        console.error.callsFake((...msg) => {
            logger_messages.push(msg);
        });
    });
    beforeEach(() => {
        WorkerController.worker_amount = 1;
        WorkerController.workers = [
            {
                pid: 1000,
                status: WorkerStatus.idle,
                process: {
                    send: (data) => {
                        send_data.push(data);
                    },
                },
            },
        ];
    });
    afterEach(() => {
        logger_messages = [];
        send_data = [];
        exit_code = 0;
    });
    after(() => {
        WorkerController.worker_amount = undefined;
        WorkerController.workers = [];
        sandbox.restore();
    });
    it('undefined without worker', async () => {
        WorkerController.worker_amount = 1;
        WorkerController.workers = [];
        const result = await WorkerController.process_in_workers();
        strictEqual(exit_code, 1);
    });
    it('undefined', async () => {
        const result = await WorkerController.process_in_workers();
        strictEqual(exit_code, 0);
        deepStrictEqual(logger_messages, [['\x1B[31m✖\x1B[39m', '\x1B[31munknown action\x1B[39m']]);
    });
    it('undefined action', async () => {
        const result = await WorkerController.process_in_workers(undefined, []);
        strictEqual(result, false);
        strictEqual(exit_code, 0);
        deepStrictEqual(logger_messages, [['\x1B[31m✖\x1B[39m', '\x1B[31munknown action\x1B[39m']]);
    });
    it('undefined action with list', async () => {
        const result = await WorkerController.process_in_workers(undefined, [true]);
        strictEqual(result, false);
        strictEqual(exit_code, 0);
        deepStrictEqual(logger_messages, [['\x1B[31m✖\x1B[39m', '\x1B[31munknown action\x1B[39m']]);
    });
    it('correct batch size', async () => {
        WorkerController.workers = new Array(2).fill(true).map((item, index) => {
            const pid = 1000 + index;
            return {
                pid,
                status: WorkerStatus.idle,
                process: {
                    send: (data) => {
                        send_data.push(data);
                        setTimeout(() => {
                            WorkerController.workers.find((ref_worker) => {
                                if (ref_worker.pid == pid) {
                                    ref_worker.status = WorkerStatus.done;
                                    return true;
                                }
                            });
                            Event.emit('worker_status', WorkerStatus.done, { pid });
                            setTimeout(() => {
                                WorkerController.workers.find((ref_worker) => {
                                    if (ref_worker.pid == pid) {
                                        ref_worker.status = WorkerStatus.idle;
                                        return true;
                                    }
                                });
                                Event.emit('worker_status', WorkerStatus.idle, { pid });
                            }, 0);
                        }, 0);
                    },
                },
            };
        });
        WorkerController.worker_amount = WorkerController.workers.length;
        const list = new Array(10).fill(true);
        const result = await WorkerController.process_in_workers(WorkerAction.log, list, 1000);
        strictEqual(result, true);
        strictEqual(exit_code, 0);
        deepStrictEqual(send_data, [
            {
                action: {
                    key: 0,
                    value: [true, true, true, true, true],
                },
            },
            {
                action: {
                    key: 0,
                    value: [true, true, true, true, true],
                },
            },
        ]);
        deepStrictEqual(logger_messages, [
            ['\x1B[34mℹ\x1B[39m', 'process \x1B[34m10\x1B[39m items, batch size \x1B[36m1000\x1B[39m'],
        ]);
    });
    it('single item list', async () => {
        WorkerController.workers = new Array(2).fill(true).map((item, index) => {
            const pid = 1000 + index;
            return {
                pid,
                status: WorkerStatus.idle,
                process: {
                    send: (data) => {
                        send_data.push(data);
                        setTimeout(() => {
                            WorkerController.workers.find((ref_worker) => {
                                if (ref_worker.pid == pid) {
                                    ref_worker.status = WorkerStatus.done;
                                    return true;
                                }
                            });
                            Event.emit('worker_status', WorkerStatus.done, { pid });
                            setTimeout(() => {
                                WorkerController.workers.find((ref_worker) => {
                                    if (ref_worker.pid == pid) {
                                        ref_worker.status = WorkerStatus.idle;
                                        return true;
                                    }
                                });
                                Event.emit('worker_status', WorkerStatus.idle, { pid });
                            }, 0);
                        }, 0);
                    },
                },
            };
        });
        WorkerController.worker_amount = WorkerController.workers.length;
        const list = [true];
        const result = await WorkerController.process_in_workers(WorkerAction.log, list, 1000);
        strictEqual(result, true);
        strictEqual(exit_code, 0);
        deepStrictEqual(send_data, [
            {
                action: {
                    key: 0,
                    value: [true],
                },
            }
        ]);
        deepStrictEqual(logger_messages, [
            ['\x1B[34mℹ\x1B[39m', 'process \x1B[34m1\x1B[39m item, batch size \x1B[36m1000\x1B[39m'],
        ]);
    });
    it('empty list', async () => {
        WorkerController.workers = new Array(2).fill(true).map((item, index) => {
            const pid = 1000 + index;
            return {
                pid,
                status: WorkerStatus.idle,
                process: {
                    send: (data) => {
                        send_data.push(data);
                        setTimeout(() => {
                            WorkerController.workers.find((ref_worker) => {
                                if (ref_worker.pid == pid) {
                                    ref_worker.status = WorkerStatus.done;
                                    return true;
                                }
                            });
                            Event.emit('worker_status', WorkerStatus.done, { pid });
                            setTimeout(() => {
                                WorkerController.workers.find((ref_worker) => {
                                    if (ref_worker.pid == pid) {
                                        ref_worker.status = WorkerStatus.idle;
                                        return true;
                                    }
                                });
                                Event.emit('worker_status', WorkerStatus.idle, { pid });
                            }, 0);
                        }, 0);
                    },
                },
            };
        });
        WorkerController.worker_amount = WorkerController.workers.length;
        const list = [];
        const result = await WorkerController.process_in_workers(WorkerAction.log, list, 1000);
        strictEqual(result, true);
        strictEqual(exit_code, 0);
        deepStrictEqual(send_data, []);
        deepStrictEqual(logger_messages, [
            ['\x1B[35m♥\x1B[39m', '\x1B[35mno items to process, batch size \x1B[36m1000\x1B[39m\x1B[35m\x1B[39m'],
        ]);
    });
    it('empty batch size', async () => {
        WorkerController.workers = new Array(2).fill(true).map((item, index) => {
            const pid = 1000 + index;
            return {
                pid,
                status: WorkerStatus.idle,
                process: {
                    send: (data) => {
                        send_data.push(data);
                        setTimeout(() => {
                            WorkerController.workers.find((ref_worker) => {
                                if (ref_worker.pid == pid) {
                                    ref_worker.status = WorkerStatus.done;
                                    return true;
                                }
                            });
                            Event.emit('worker_status', WorkerStatus.done, { pid });
                            setTimeout(() => {
                                WorkerController.workers.find((ref_worker) => {
                                    if (ref_worker.pid == pid) {
                                        ref_worker.status = WorkerStatus.idle;
                                        return true;
                                    }
                                });
                                Event.emit('worker_status', WorkerStatus.idle, { pid });
                            }, 0);
                        }, 0);
                    },
                },
            };
        });
        WorkerController.worker_amount = WorkerController.workers.length;
        const list = new Array(10).fill(true);
        const result = await WorkerController.process_in_workers(WorkerAction.log, list);
        strictEqual(result, true);
        strictEqual(exit_code, 0);
        deepStrictEqual(send_data, [
            {
                action: {
                    key: 0,
                    value: [true, true, true, true, true],
                },
            },
            {
                action: {
                    key: 0,
                    value: [true, true, true, true, true],
                },
            },
        ]);
        deepStrictEqual(logger_messages, [
            ['\x1B[34mℹ\x1B[39m', 'process \x1B[34m10\x1B[39m items, batch size \x1B[36m10\x1B[39m'],
        ]);
    });
});
