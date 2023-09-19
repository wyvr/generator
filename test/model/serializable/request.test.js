import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { SerializableRequest } from '../../../src/model/serializable/request.js';

describe('model/serializable/request', () => {
    it('should return undefined if url is not present', () => {
        const request = {
            httpVersionMajor: 1,
            httpVersionMinor: 1,
            httpVersion: '1.1',
            method: 'GET',
            query: {},
            body: {},
            files: [],
        };
        const result = SerializableRequest(request);
        deepStrictEqual(result, undefined);
    });

    it('should return serialized request object when url is present', () => {
        const request = {
            httpVersionMajor: 1,
            httpVersionMinor: 1,
            httpVersion: '1.1',
            url: '/test',
            method: 'GET',
            query: {},
            body: {},
            files: [],
        };
        const expected = {
            httpVersionMajor: 1,
            httpVersionMinor: 1,
            httpVersion: '1.1',
            url: '/test',
            method: 'GET',
            query: {},
            body: {},
            files: [],
        };
        const result = SerializableRequest(request);
        deepStrictEqual(result, expected);
    });

    it('should apply default values correctly', () => {
        const request = {
            url: '/test',
            method: 'GET',
        };
        const default_values = {
            httpVersionMajor: 1,
            httpVersionMinor: 1,
            httpVersion: '1.1',
            query: {},
            body: {},
            files: [],
        };
        const expected = {
            httpVersionMajor: 1,
            httpVersionMinor: 1,
            httpVersion: '1.1',
            url: '/test',
            method: 'GET',
            query: {},
            body: {},
            files: [],
        };
        const result = SerializableRequest(request, default_values);
        deepStrictEqual(result, expected);
    });
    it('if no method is set use GET', () => {
        const request = {
            url: '/test',
        };
        const default_values = {
            httpVersionMajor: 1,
            httpVersionMinor: 1,
            httpVersion: '1.1',
            query: {},
            body: {},
            files: [],
        };
        const expected = {
            httpVersionMajor: 1,
            httpVersionMinor: 1,
            httpVersion: '1.1',
            url: '/test',
            method: 'GET',
            query: {},
            body: {},
            files: [],
        };
        const result = SerializableRequest(request, default_values);
        deepStrictEqual(result, expected);
    });
});
