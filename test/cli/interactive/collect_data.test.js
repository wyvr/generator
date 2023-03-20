import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { collect_data } from '../../../src/cli/interactive.js';
import { to_plain } from '../../../src/utils/to.js';

describe('cli/interactive/collect_data', () => {
    let log = [];
    let console_error;
    beforeEach(() => {
        console_error = console.error;
        console.error = (...values) => {
            log.push(values.map(to_plain));
        };
    });
    afterEach(() => {
        log = [];
        console_error = console.error;
    });
    it('undefined', async () => {
        deepStrictEqual(await collect_data(), {});
        deepStrictEqual(log, []);
    });
    it('wrong types', async () => {
        deepStrictEqual(await collect_data(true, true), {});
        deepStrictEqual(log, []);
    });
    it('wrong type with callback', async () => {
        deepStrictEqual(await collect_data([], { key: 'value' }, true), { key: 'value' });
        deepStrictEqual(log, []);
    });
    it('simple questions', async () => {
        deepStrictEqual(
            await collect_data(
                [
                    [
                        { name: 'a', type: 'input' },
                        { name: 'b', type: 'input' },
                    ],
                    [],
                ],
                { key: 'value' },
                (questions) => {
                    const result = {};
                    questions.forEach((q) => {
                        result[q.name] = q.name;
                    });
                    return result;
                }
            ),
            { key: 'value', a: 'a', b: 'b' }
        );
        deepStrictEqual(log, []);
    });
    it('conditions', async () => {
        deepStrictEqual(
            await collect_data(
                [
                    [{ name: 'a', type: 'input' }],
                    {
                        _field: 'a',
                        a: [[{ name: 'b', type: 'input' }]],
                        _: [],
                    },
                    [{ name: 'c', type: 'input' }],
                ],
                { key: 'value' },
                (questions) => {
                    const result = {};
                    questions.forEach((q) => {
                        result[q.name] = q.name;
                    });
                    return result;
                }
            ),
            { key: 'value', a: 'a', b: 'b', c: 'c' }
        );
        deepStrictEqual(log, []);
    });
    it('broken callback', async () => {
        deepStrictEqual(
            await collect_data([[{ name: 'a', type: 'input' }]], { key: 'value' }, () => {
                return false;
            }),
            { key: 'value' }
        );
        deepStrictEqual(log, []);
    });
    it('fallback conditions', async () => {
        deepStrictEqual(
            await collect_data(
                [
                    [{ name: 'a', type: 'input' }],
                    {
                        _field: 'a',
                        b: [],
                        _: [[{ name: 'b', type: 'input' }]],
                    },
                    [{ name: 'c', type: 'input' }],
                ],
                { key: 'value' },
                (questions) => {
                    const result = {};
                    questions.forEach((q) => {
                        result[q.name] = q.name;
                    });
                    return result;
                }
            ),
            { key: 'value', a: 'a', b: 'b', c: 'c' }
        );
        deepStrictEqual(log, []);
    });
    it('missing condition value', async () => {
        deepStrictEqual(
            await collect_data(
                [
                    {
                        _field: 'a',
                        b: [[{ name: 'b', type: 'input' }]],
                        _: [[{ name: 'c', type: 'input' }]],
                    },
                ],
                { key: 'value' },
                (questions) => {
                    const result = {};
                    questions.forEach((q) => {
                        result[q.name] = q.name;
                    });
                    return result;
                }
            ),
            { key: 'value' }
        );
        deepStrictEqual(log, [['⚠', 'missing field "a" for question condition']]);
    });
    it('missing condition value and fallback', async () => {
        deepStrictEqual(
            await collect_data(
                [
                    {
                        _field: 'a',
                        b: [[{ name: 'b', type: 'input' }]],
                    },
                ],
                { key: 'value' },
                (questions) => {
                    const result = {};
                    questions.forEach((q) => {
                        result[q.name] = q.name;
                    });
                    return result;
                }
            ),
            { key: 'value' }
        );
        deepStrictEqual(log, [['⚠', 'missing field "a" for question condition']]);
    });
    it('missing _field in condition', async () => {
        deepStrictEqual(
            await collect_data(
                [
                    [{ name: 'a', type: 'input' }],
                    {
                        _: [[{ name: 'b', type: 'input' }]],
                    },
                    [{ name: 'c', type: 'input' }],
                ],
                { key: 'value' },
                (questions) => {
                    const result = {};
                    questions.forEach((q) => {
                        result[q.name] = q.name;
                    });
                    return result;
                }
            ),
            { key: 'value', a: 'a', c: 'c' }
        );
        deepStrictEqual(log, []);
    });
    it('array condition', async () => {
        deepStrictEqual(
            await collect_data(
                [
                    {
                        _field: 'key',
                        a: [[{ name: 'a', type: 'input' }]],
                        b: [[{ name: 'b', type: 'input' }]],
                        _: [[{ name: 'd', type: 'input' }]],
                    },
                    [{ name: 'c', type: 'input' }],
                ],
                { key: ['a', 'b'] },
                (questions) => {
                    const result = {};
                    questions.forEach((q) => {
                        result[q.name] = q.name;
                    });
                    return result;
                }
            ),
            { key: ['a', 'b'], a: 'a', b: 'b', c: 'c' }
        );
        deepStrictEqual(log, []);
    });
    it('missing array condition', async () => {
        deepStrictEqual(
            await collect_data(
                [
                    {
                        _field: 'key',
                        a: [[{ name: 'a', type: 'input' }]],
                        b: [[{ name: 'b', type: 'input' }]],
                        _: [[{ name: 'd', type: 'input' }]],
                    },
                    [{ name: 'c', type: 'input' }],
                ],
                { key: ['c'] },
                (questions) => {
                    const result = {};
                    questions.forEach((q) => {
                        result[q.name] = q.name;
                    });
                    return result;
                }
            ),
            { key: ['c'], c: 'c' }
        );
        deepStrictEqual(log, []);
    });
    it('unknown value message', async () => {
        deepStrictEqual(
            await collect_data(
                [
                    {
                        _field: 'a',
                    },
                ],
                { a: 'a' },
                (questions) => {
                    const result = {};
                    questions.forEach((q) => {
                        result[q.name] = q.name;
                    });
                    return result;
                }
            ),
            { a: 'a' }
        );
        deepStrictEqual(log, [['✖', 'unknown value "a" for a']]);
    });
    it('X', async () => {
        deepStrictEqual(
            await collect_data([[{ name: 'a', type: 'input', message: 'message' }]], { a: 'b' }, (questions) => {
                const result = {};
                questions.forEach((q) => {
                    result[q.name] = q.name;
                });
                return result;
            }),
            { a: 'b' }
        );
        deepStrictEqual(log, []);
    });
});
