import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { filter_cronjobs } from '../../../src/utils/cron.js';
import { to_plain } from '../../../src/utils/to.js';

describe('utils/cron/filter_cronjobs', () => {
    let sandbox;
    let log = [];

    before(() => {
        sandbox = Sinon.createSandbox();
        sandbox.stub(console, 'error');
        console.error.callsFake((...args) => {
            log.push(args.map(to_plain));
        });
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        sandbox.restore();
    });

    it('returns empty array for non existing input', () => {
        deepStrictEqual(filter_cronjobs(), []);
    });
    it('returns empty array for empty input', () => {
        deepStrictEqual(filter_cronjobs({}), []);
    });
    it('returns empty array for empty input', () => {
        deepStrictEqual(filter_cronjobs({ a: {} }), []);
        deepStrictEqual(log, [['⚠', 'cron "a" missing when or what properties']]);
    });
    it('invalid when', () => {
        deepStrictEqual(filter_cronjobs({ a: { when: 'test', what: 'a' } }), []);
        deepStrictEqual(log, [['⚠', 'cron "a" has an invalid when property "test"']]);
    });

    it('returns only jobs that should be executed now', () => {
        const cronjobs = {
            a: { when: '*', what: 'a' },
            b: { when: '* *', what: 'b' },
            c: { when: '* * *', what: 'c' },
            d: { when: '* * * *', what: 'd' },
            e: { when: '* * * * *', what: 'e' }
        };
        const result = filter_cronjobs(cronjobs);
        const expectedJobs = [{ name: 'e', when: '* * * * *', what: 'e', failed: false }];
        deepStrictEqual(result, expectedJobs);
        deepStrictEqual(log, [
            ['⚠', 'cron "a" has an invalid when property "*"'],
            ['⚠', 'cron "b" has an invalid when property "* *"'],
            ['⚠', 'cron "c" has an invalid when property "* * *"'],
            ['⚠', 'cron "d" has an invalid when property "* * * *"']
        ]);
    });
    it('returns empty array when cronjob does not match the current time', () => {
        const date = new Date();
        const when = `${date.getMinutes() - 2} ${date.getHours()} * * *`;
        deepStrictEqual(filter_cronjobs({ a: { when, what: 'a' } }), []);
        deepStrictEqual(log, []);
    });
    it('match the current time', () => {
        const date = new Date();
        const when = `${date.getMinutes()} ${date.getHours()} * * *`;
        deepStrictEqual(filter_cronjobs({ a: { when, what: 'a' } }), [{ name: 'a', when, what: 'a', failed: false }]);
        deepStrictEqual(log, []);
    });
    it('ignore trigger based cronjobs', () => {
        const date = new Date();
        deepStrictEqual(filter_cronjobs({ a: { when: '@build', what: 'a' } }), []);
        deepStrictEqual(log, []);
    });
    it('get trigger based cronjobs, when provide event name', () => {
        const date = new Date();
        deepStrictEqual(filter_cronjobs({ a: { when: '@build', what: 'a' }, b: { when: '* * * * *', what: 'b' } }, 'build'), [
            { name: 'a', when: '@build', what: 'a', failed: false }
        ]);
        deepStrictEqual(log, []);
    });
    it('match the current time', () => {
        const clock = Sinon.useFakeTimers(new Date('2000-01-01 10:00:00'));
        const date = new Date();
        const when = `${date.getMinutes()} ${date.getHours()} * * *`;
        deepStrictEqual(filter_cronjobs({ a: { when, what: 'a' } }), [{ name: 'a', when, what: 'a', failed: false }]);
        deepStrictEqual(log, []);
        clock.restore();
    });
    it('match the current time with steps', () => {
        const clock = Sinon.useFakeTimers(new Date('2000-01-01 10:15:00'));
        const when = '*/15 * * * *';
        deepStrictEqual(filter_cronjobs({ a: { when, what: 'a' } }), [{ name: 'a', when, what: 'a', failed: false }]);
        deepStrictEqual(log, []);
        clock.restore();
    });
    it('not matching the current time with steps', () => {
        const clock = Sinon.useFakeTimers(new Date('2000-01-01 10:16:00'));
        const when = '*/15 * * * *';
        deepStrictEqual(filter_cronjobs({ a: { when, what: 'a' } }), []);
        deepStrictEqual(log, []);
        clock.restore();
    });
    it('matching the current time with steps', () => {
        const clock = Sinon.useFakeTimers(new Date('2000-01-01 10:16:00'));
        const when = '6,10,16 * * * *';
        deepStrictEqual(filter_cronjobs({ a: { when, what: 'a' } }), [{ name: 'a', when, what: 'a', failed: false }]);
        deepStrictEqual(log, []);
        clock.restore();
    });
    it('not matching the current time with steps', () => {
        const clock = Sinon.useFakeTimers(new Date('2000-01-01 10:15:00'));
        const when = '6,10,16 * * * *';
        deepStrictEqual(filter_cronjobs({ a: { when, what: 'a' } }), []);
        deepStrictEqual(log, []);
        clock.restore();
    });
});
