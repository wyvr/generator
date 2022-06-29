import { deepStrictEqual } from 'assert';
import { join } from 'path';
import { exists } from '../../../src/utils/file.js';
import { process as process_media } from '../../../src/utils/media.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/media/process', () => {
    before(() => {
        Cwd.set(process.cwd());
    });
    after(() => {
        Cwd.set(undefined);
    });
    // it('undefined', async () => {});
    it('file', async () => {
        const file = {
            src: 'assets/slider/1.jpg',
            result: '/media/eyJ3aWR0aCI6MzAwLCJoZWlnaHQiOjE1MCwibW9kZSI6ImNvdmVyIiwiZm9ybWF0Ijoid2VicCIsInF1YWxpdHkiOjYwfQ==/assets/slider/1.webp',
            width: 300,
            height: 150,
            mode: 'cover',
            format: 'webp',
            hash: 'eyJ3aWR0aCI6MzAwLCJoZWlnaHQiOjE1MCwibW9kZSI6ImNvdmVyIiwiZm9ybWF0Ijoid2VicCIsInF1YWxpdHkiOjYwfQ==',
            quality: 60,
            output: 'path',
        };
        await process_media(file);
        deepStrictEqual(exists(join(process.cwd(), file.result)), false);
    });
});
