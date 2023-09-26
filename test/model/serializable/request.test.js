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
            headers: {},
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
            headers: {},
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
            headers: {},
        };
        const result = SerializableRequest(request, default_values);
        deepStrictEqual(result, expected);
    });
    it('add headers', () => {
        const request = {
            url: '/test',
            headers: {
                host: 'wyvr.dev',
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/117.0',
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'en-US,en;q=0.5',
                DNT: '1',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'sec-fetch-user': '?1',
                'sec-gpc': '1',
                'upgrade-insecure-requests': '1',
            },
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
            headers: {
                host: 'wyvr.dev',
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/117.0',
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'en-US,en;q=0.5',
                dnt: '1',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'sec-fetch-user': '?1',
                'sec-gpc': '1',
                'upgrade-insecure-requests': '1',
            },
        };
        const result = SerializableRequest(request, default_values);
        deepStrictEqual(result, expected);
    });
});
