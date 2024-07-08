import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { SerializableResponse } from '../../../src/model/serializable/response.js';
import { to_plain } from '../../../src/utils/to.js';
import Sinon from 'sinon';
import { Env } from '../../../src/vars/env.js';
import { EnvType } from '../../../src/struc/env.js';

describe('model/serializable/response', () => {
    let sandbox;
    let log = [];
    before(() => {
        sandbox = Sinon.createSandbox();
        sandbox.stub(console, 'log');
        console.log.callsFake((...args) => {
            log.push(args.map(to_plain));
        });
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        sandbox.restore();
    });
    it('serialize', () => {
        const response = new SerializableResponse();
        deepStrictEqual(response.serialize(), {
            headers: {},
            complete: false,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: undefined,
            encoding: undefined,
        });
    });
    it('set uid', () => {
        const response = new SerializableResponse();
        response.uid = '0000';
        deepStrictEqual(response.serialize(), {
            headers: {},
            complete: false,
            statusCode: 200,
            statusMessage: undefined,
            uid: '0000',
            data: undefined,
            encoding: undefined,
        });
    });
    it('headersSent', () => {
        const response = new SerializableResponse();
        strictEqual(response.headersSent, false);
        response.end();
        strictEqual(response.headersSent, true);
    });
    it('writableEnded', () => {
        const response = new SerializableResponse();
        strictEqual(response.writableEnded, false);
        response.end();
        strictEqual(response.writableEnded, true);
    });
    it('writableFinished', () => {
        const response = new SerializableResponse();
        strictEqual(response.writableFinished, false);
        response.end();
        strictEqual(response.writableFinished, true);
    });
    it('end', () => {
        const response = new SerializableResponse();
        response.end();
        deepStrictEqual(response.serialize(), {
            headers: {},
            complete: true,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: undefined,
            encoding: 'utf-8',
        });
    });
    it('end with data', () => {
        const response = new SerializableResponse();
        response.end('test');
        deepStrictEqual(response.serialize(), {
            headers: {},
            complete: true,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: 'test',
            encoding: 'utf-8',
        });
    });
    it('end with encoding', () => {
        const response = new SerializableResponse();
        response.end(undefined, 'ascii');
        deepStrictEqual(response.serialize(), {
            headers: {},
            complete: true,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: undefined,
            encoding: 'ascii',
        });
    });
    it('end already ended response', () => {
        const response = new SerializableResponse();
        response.end(undefined, 'ascii');
        response.end('test');
        deepStrictEqual(response.serialize(), {
            headers: {},
            complete: true,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: undefined,
            encoding: 'ascii',
        });
        deepStrictEqual(log, [
            ['✖', 'Response is already complete, can not end again'],
        ]);
    });
    it('getHeader empty', () => {
        const response = new SerializableResponse();
        deepStrictEqual(response.getHeader('key'), undefined);
    });
    it('getHeader existing', () => {
        const response = new SerializableResponse();
        response.setHeader('key', 'value');
        deepStrictEqual(response.getHeader('key'), 'value');
    });
    it('getHeaderNames empty', () => {
        const response = new SerializableResponse();
        deepStrictEqual(response.getHeaderNames(), []);
    });
    it('getHeaderNames with key', () => {
        const response = new SerializableResponse();
        response.setHeader('key', 'value');
        deepStrictEqual(response.getHeaderNames(), ['key']);
    });
    it('getHeaders empty', () => {
        const response = new SerializableResponse();
        deepStrictEqual(response.getHeaders(), {});
    });
    it('getHeaders with key', () => {
        const response = new SerializableResponse();
        response.setHeader('key', 'value');
        deepStrictEqual(response.getHeaders(), { key: 'value' });
    });
    it('hasHeader contains header', () => {
        const response = new SerializableResponse();
        response.setHeader('key', 'value');
        strictEqual(response.hasHeader('key'), true);
    });
    it('hasHeader does not contain header', () => {
        const response = new SerializableResponse();
        strictEqual(response.hasHeader('key'), false);
    });
    it('hasHeader ignore case', () => {
        const response = new SerializableResponse();
        response.setHeader('key', 'value');
        strictEqual(response.hasHeader('Key'), true);
    });
    it('removeHeader', () => {
        const response = new SerializableResponse();
        response.setHeader('key', 'value');
        response.removeHeader('key');
        deepStrictEqual(response.serialize(), {
            headers: {},
            complete: false,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: undefined,
            encoding: undefined,
        });
    });
    it('removeHeader to complete response', () => {
        const response = new SerializableResponse();
        response.setHeader('key', 'value');
        response.end();
        response.removeHeader('key');
        deepStrictEqual(response.serialize(), {
            headers: { key: 'value' },
            complete: true,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: undefined,
            encoding: 'utf-8',
        });
        deepStrictEqual(log, [
            ['✖', 'Response is already complete, can not remove header'],
        ]);
    });
    it('setHeader', () => {
        const response = new SerializableResponse();
        response.setHeader('key', 'value');
        deepStrictEqual(response.serialize(), {
            headers: { key: 'value' },
            complete: false,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: undefined,
            encoding: undefined,
        });
    });
    it('setHeader override', () => {
        const response = new SerializableResponse();
        response.setHeader('key', 'test');
        response.setHeader('key', 'value');
        deepStrictEqual(response.serialize(), {
            headers: { key: 'value' },
            complete: false,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: undefined,
            encoding: undefined,
        });
    });
    it('setHeader lowercase', () => {
        const response = new SerializableResponse();
        response.setHeader('Key', 'value');
        deepStrictEqual(response.serialize(), {
            headers: { key: 'value' },
            complete: false,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: undefined,
            encoding: undefined,
        });
    });
    it('setHeader to complete response', () => {
        const response = new SerializableResponse();
        response.end();
        response.setHeader('key', 'value');
        deepStrictEqual(response.serialize(), {
            headers: {},
            complete: true,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: undefined,
            encoding: 'utf-8',
        });
        deepStrictEqual(log, [
            ['✖', 'Response is already complete, can not set header'],
        ]);
    });
    it('write', () => {
        const response = new SerializableResponse();
        response.write('test');
        deepStrictEqual(response.serialize(), {
            headers: {},
            complete: false,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: 'test',
            encoding: 'utf-8',
        });
    });
    it('write to complete response', () => {
        const response = new SerializableResponse();
        response.end();
        response.write('test');
        deepStrictEqual(response.serialize(), {
            headers: {},
            complete: true,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: undefined,
            encoding: 'utf-8',
        });
        deepStrictEqual(log, [
            ['✖', 'Response is already complete, can not write to it'],
        ]);
    });
    it('writeHead', () => {
        const response = new SerializableResponse();
        response.writeHead(400, 'message', { a: 'test' });
        deepStrictEqual(response.serialize(), {
            headers: { a: 'test' },
            complete: false,
            statusCode: 400,
            statusMessage: 'message',
            uid: undefined,
            data: undefined,
            encoding: undefined,
        });
    });
    it('writeHead to complete response, suppress message', () => {
        const response = new SerializableResponse();
        response.end();
        response.writeHead(400, 'message', { a: 'test' });
        deepStrictEqual(response.serialize(), {
            headers: {},
            complete: true,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: undefined,
            encoding: 'utf-8',
        });
        deepStrictEqual(log, []);
    });
    it('writeHead to complete response in dev mode', () => {
        Env.set(EnvType.dev);
        const response = new SerializableResponse();
        response.end();
        response.writeHead(400, 'message', { a: 'test' });
        Env.set(EnvType.prod);
        deepStrictEqual(response.serialize(), {
            headers: {},
            complete: true,
            statusCode: 200,
            statusMessage: undefined,
            uid: undefined,
            data: undefined,
            encoding: 'utf-8',
        });
        deepStrictEqual(log, [
            ['✖', 'Response is already complete, can not write head'],
        ]);
    });
});
