require('module-alias/register');

describe('Lib/Converter/Time', () => {
    const assert = require('assert');
    const { hrtime_to_ms } = require('@lib/converter/time');

    describe('hrtime_to_ms', () => {
        it('wrong value', () => {
            assert.strictEqual(hrtime_to_ms(), 0)
            assert.strictEqual(hrtime_to_ms(null), 0)
            assert.strictEqual(hrtime_to_ms('a'), 0)
            assert.strictEqual(hrtime_to_ms(5), 0)
            assert.strictEqual(hrtime_to_ms([null, null]), 0)
            assert.strictEqual(hrtime_to_ms(['a', 'a']), 0)
        });
        it('valid value', () => {
            assert.strictEqual(hrtime_to_ms([1, 0]), 1000)
            assert.strictEqual(hrtime_to_ms([0, 1000000]), 1)
            assert.strictEqual(hrtime_to_ms([0, 500000]), 0.5)
        });
    });
});
