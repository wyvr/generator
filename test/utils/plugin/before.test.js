import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { Plugin } from '../../../src/utils/plugin.js';
import { to_plain } from '../../../src/utils/to.js';

describe('utils/plugin/before', () => {
    let logger_messages = [];
    before(() => {
        Sinon.stub(console, 'log');
        console.log.callsFake((...msg) => {
            logger_messages.push(msg.map(to_plain));
        });
    });
    afterEach(() => {
        logger_messages = [];
        Plugin.clear();
    });
    after(() => {
        console.log.restore();
    });
    it('found', async () => {
        Plugin.cache = {
            a: {
                before: [
                    {
                        fn: (result) => {
                            return result + 1;
                        },
                        source: 'first',
                    },
                    {
                        fn: (result ) => {
                            return `a${result}`;
                        },
                        source: 'second',
                    },
                ],
            },
        };
        const result = await Plugin.before('a', 1);
        deepStrictEqual(result, 'a2');
        deepStrictEqual(logger_messages, []);
    });
});
