import { deepStrictEqual } from 'assert';
import { join } from 'path';
import Sinon from 'sinon';
import { exists, remove, write } from '../../../src/utils/file.js';
import { process as process_media } from '../../../src/utils/media.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/media/process', () => {
    let log = [];
    before(() => {
        Cwd.set(join(process.cwd(), 'test', 'utils', 'media', '_tests'));
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
    });
    after(() => {
        Cwd.set(undefined);
        console.error.restore();
    });
    afterEach(() => {
        remove(join(process.cwd(), 'test', 'utils', 'media', '_tests', 'media'));
        log = [];
    });
    it('undefined', async () => {
        deepStrictEqual(await process_media(), undefined);
    });
    it('result does exist', async () => {
        const file = {
            src: 'favicon.png',
            result: '/media/hash/favicon.webp',
            width: 300,
            height: 150,
            mode: 'cover',
            format: 'webp',
            hash: 'hash',
            quality: 60,
            output: 'path',
        };
        write(Cwd.get(file.result), '');
        deepStrictEqual(exists(Cwd.get(file.result)), true);
        await process_media(file);
        deepStrictEqual(log, []);
    });
    it("src doesn't exist", async () => {
        const file = {
            src: 'assets/slider/1.jpg',
            result: '/media/hash/assets/slider/1.webp',
            width: 300,
            height: 150,
            mode: 'cover',
            format: 'webp',
            hash: 'hash',
            quality: 60,
            output: 'path',
        };
        await process_media(file);
        deepStrictEqual(exists(Cwd.get(file.result)), false);
        deepStrictEqual(log, [['✖', `@media input file "assets/slider/1.jpg" doesn't exist`]]);
    });
    it('create media', async () => {
        const file = {
            src: 'favicon.png',
            result: '/media/hash/favicon.webp',
            width: 300,
            height: 150,
            mode: 'cover',
            format: 'webp',
            hash: 'hash',
            quality: 60,
            output: 'path',
        };
        await process_media(file);
        deepStrictEqual(exists(Cwd.get(file.result)), true);
        deepStrictEqual(log, []);
    });
    it('create jpg media/contain', async () => {
        const file = {
            src: 'gradient.jpg',
            result: '/media/hash/gradient.jpg',
            width: 100,
            height: 100,
            mode: 'contain',
            format: 'jpeg',
            hash: 'hash',
            quality: 60,
            output: 'path',
        };
        await process_media(file);
        deepStrictEqual(exists(Cwd.get(file.result)), true);
        deepStrictEqual(log, []);
    });
    it('empty media', async () => {
        const file = {
            src: 'empty.jpg',
            result: '/media/hash/empty.jpg',
            width: 100,
            height: 100,
            mode: 'contain',
            format: 'jpeg',
            hash: 'hash',
            quality: 60,
            output: 'path',
        };
        await process_media(file);
        deepStrictEqual(exists(Cwd.get(file.result)), false);
        deepStrictEqual(log, [['✖', '@sharp\n[Error] Input Buffer is empty\nsource empty.jpg']]);
    });
    it('unsupported output value', async () => {
        const file = {
            src: 'favicon.png',
            result: '/media/hash/favicon.webp',
            width: 300,
            height: 150,
            mode: 'cover',
            format: 'webp',
            hash: 'hash',
            quality: 60,
            output: 'base64',
        };
        await process_media(file);
        deepStrictEqual(exists(Cwd.get(file.result)), true);
        deepStrictEqual(log, [
            ['⚠', 'media favicon.png output "base64" is not implemented at the moment, falling back to path'],
        ]);
    });
    it('jpg format', async () => {
        const file = {
            src: 'favicon.png',
            result: '/media/hash/favicon.jpg',
            width: 300,
            height: 150,
            mode: 'cover',
            format: 'jpg',
            hash: 'hash',
            quality: 60,
            output: 'path',
        };
        await process_media(file);
        deepStrictEqual(exists(Cwd.get(file.result)), true);
        deepStrictEqual(log, []);
    });
    it('avif format', async () => {
        const file = {
            src: 'favicon.png',
            result: '/media/hash/favicon.avif',
            width: 300,
            height: 150,
            mode: 'cover',
            format: 'avif',
            hash: 'hash',
            quality: 60,
            output: 'path',
        };
        await process_media(file);
        deepStrictEqual(exists(Cwd.get(file.result)), true);
        deepStrictEqual(log, []);
    });
    it('heif format', async () => {
        const file = {
            src: 'favicon.png',
            result: '/media/hash/favicon.avif',
            width: 300,
            height: 150,
            mode: 'cover',
            format: 'heif',
            hash: 'hash',
            quality: 60,
            output: 'path',
        };
        await process_media(file);
        deepStrictEqual(exists(Cwd.get(file.result)), true);
        deepStrictEqual(log, []);
    });
    it('png format', async () => {
        const file = {
            src: 'favicon.png',
            result: '/media/hash/favicon.png',
            width: 300,
            height: 150,
            mode: 'cover',
            format: 'png',
            hash: 'hash',
            quality: 60,
            output: 'path',
        };
        await process_media(file);
        deepStrictEqual(exists(Cwd.get(file.result)), true);
        deepStrictEqual(log, []);
    });
    it('gif format', async () => {
        const file = {
            src: 'favicon.png',
            result: '/media/hash/favicon.gif',
            width: 300,
            height: 150,
            mode: 'cover',
            format: 'gif',
            hash: 'hash',
            quality: 60,
            output: 'path',
        };
        await process_media(file);
        deepStrictEqual(exists(Cwd.get(file.result)), true);
        deepStrictEqual(log, []);
    });
    it('unsupported format', async () => {
        const file = {
            src: 'favicon.png',
            result: '/media/hash/favicon.xlsx',
            width: 300,
            height: 150,
            mode: 'cover',
            format: 'xlsx',
            hash: 'hash',
            quality: 60,
            output: 'path',
        };
        await process_media(file);
        deepStrictEqual(exists(Cwd.get(file.result)), false);
        deepStrictEqual(log, [['✖', '@sharp\n[] no buffer available\nsource favicon.png']]);
    });
    it('create svg media', async () => {
        const file = {
            src: 'circle.svg',
            result: '/media/hash/circle.svg',
            width: 300,
            height: 150,
            mode: 'cover',
            format: 'svg',
            hash: 'hash',
            quality: 60,
            output: 'path',
        };
        await process_media(file);
        deepStrictEqual(exists(Cwd.get(file.result)), true);
        deepStrictEqual(log, []);
    });
    it('media is directory', async () => {
        const file = {
            src: 'folder/',
            result: '/media/hash/folder/',
            width: 300,
            height: 150,
            mode: 'cover',
            format: 'svg',
            hash: 'hash',
            quality: 60,
            output: 'path',
        };
        await process_media(file);
        deepStrictEqual(exists(Cwd.get(file.result)), false);
        deepStrictEqual(log, [['✖', `@media input file "folder/" doesn't exist`]]);
    });
});
