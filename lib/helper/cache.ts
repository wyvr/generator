import { join } from 'path';
import { File } from '@lib/file';

export const write_cache = (file: string, data) => {
    const file_path = join(process.cwd(), 'cache', file);
    File.write_json(file_path, data);
};

export const read_cache = (file: string) => {
    const file_path = join(process.cwd(), 'cache', file);
    return File.read_json(file_path);
};
