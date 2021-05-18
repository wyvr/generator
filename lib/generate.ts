import * as fs from 'fs-extra';
import { File } from '@lib/file';

export class Generate {
    static get(filepath: string): any {
        const json = File.read_json(filepath);
        return json;
    }
}