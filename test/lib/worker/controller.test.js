require('module-alias/register');

describe('Lib/Worker/Controller', () => {
    const assert = require('assert');
    const { WorkerController } = require('@lib/worker/controller');
    const { WorkerStatus } = require('@lib/model/worker/status');
    const { WorkerAction } = require('@lib/model/worker/action');
    const { LogType } = require('@lib/model/log');
    let send = null;
    let messages = [];
    before(() => {
        send = process.send;
        process.send = (data) => {
            messages.push(data.data);
        };
        process.env.WYVR_ENV = 'debug';
    });
    afterEach(() => {
        messages = [];
    });
    
});
