require('module-alias/register');

describe('Lib/Publish', () => {
    const assert = require('assert');
    const { Publish } = require('@lib/publish');
    const { removeSync, existsSync, mkdirSync, readlinkSync } = require('fs-extra');
    const { join } = require('path');

    describe('release', () => {
        it('empty', () => {
            Publish.release();
            assert.strictEqual(Publish.release(), false);
        });
        it('non existing release', () => {
            assert.strictEqual(Publish.release('nonexisting'), false);
            assert.strictEqual(existsSync(join('releases', 'nonexisting')), false);
        });
        it('existing release', () => {
            mkdirSync(join('releases', 'new'));

            assert.strictEqual(Publish.release('new'), true);
            assert.strictEqual(readlinkSync('pub'), join(process.cwd(), 'releases', 'new'));
            removeSync(join('releases', 'new'));
        });
    });
    describe('cleanup', () => {
        it('default keep, pub does not exist', () => {
            removeSync('pub');
            removeSync('releases');
            assert.deepStrictEqual(Publish.cleanup(), []);
        });
        it('default keep, pub exists', () => {
            removeSync('pub');
            const release1 = join('releases', '1');
            mkdirSync(release1, { recursive: true });
            const result_release = Publish.release('1');
            assert.strictEqual(result_release, true);
            assert.strictEqual(readlinkSync('pub'), join(process.cwd(), 'releases', '1'));
            const result_cleanup = Publish.cleanup();
            assert.strictEqual(result_cleanup.length, 1);
            assert.strictEqual(result_cleanup[0].release, '1');
            assert(result_cleanup[0].ctime != null);
            removeSync(join('releases', '1'));
        });
        it('release multiple times', () => {
            removeSync('pub');
            for (let i = 1; i <= 3; i++) {
                const release1 = join('releases', i + '');
                mkdirSync(release1, { recursive: true });
                const result_release = Publish.release(i + '');
                assert.strictEqual(result_release, true);
            }
            assert.strictEqual(readlinkSync('pub'), join(process.cwd(), 'releases', '3'));
            const result_cleanup = Publish.cleanup();
            assert.strictEqual(result_cleanup.length, 3);
            for (let i = 1; i <= 3; i++) {
                removeSync(join('releases', i + ''));
            }
        });
    });
});
