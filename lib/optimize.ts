import { createHash as cryptoCreateHash, Hash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, basename, extname, join } from 'path';
import { File } from '@lib/file';

export class Optimize {
    static create_hash_of_file(file_path: string): string {
        const hash = cryptoCreateHash('sha256');
        hash.update(readFileSync(file_path, { encoding: 'utf-8' }));
        const content_hash = hash.digest('hex').substr(0, 8);
        const ext = extname(file_path);
        const dir = dirname(file_path);
        const file = basename(file_path, ext);
        return join(dir, `${file}_${content_hash}${ext}`);
    }
    static get_hashed_files() {
        const replace_hash_files = [];
        const files = [].concat(File.collect_files('gen/css'), File.collect_files('gen/js'));
        const list = files.map((file) => {
            const hash = Optimize.create_hash_of_file(file);
            replace_hash_files.push({
                before: file.replace('gen', ''),
                after: hash.replace('gen', ''),
            });
            return { file, hash };
        });
        return [replace_hash_files, list];
    }
    static replace_hashed_files_in_files(file_list: any[], hash_list: any[]) {
        file_list.forEach(({ file, hash }) => {
            let content = this.replace_hashed_files(readFileSync(file, { encoding: 'utf-8' }), hash_list);

            writeFileSync(hash, content);
        });
    }
    static replace_hashed_files(content:string, hash_list: any[]) {
        hash_list.forEach(({ before, after }) => {
            content = content.replace(new RegExp(before.replace(/\//, '\\/'), 'g'), after);
        });
        return content;
    }
}
