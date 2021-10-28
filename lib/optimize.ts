import { createHash as cryptoCreateHash } from 'crypto';
import { dirname, basename, extname, join } from 'path';
import { File } from '@lib/file';
import { Logger } from '@lib/logger';
import { Error } from '@lib/error';

export class Optimize {
    static create_hash_of_file(file_path: string): string {
        const content = File.read(file_path);
        if (!content) {
            Logger.debug(Error.get({ message: 'file does not exist or is empty' }, file_path, 'optimize'));
            return null;
        }
        const hash = cryptoCreateHash('sha256');
        hash.update(content);
        const content_hash = hash.digest('hex').substr(0, 8);
        const ext = extname(file_path);
        const dir = dirname(file_path);
        const file = basename(file_path, ext);
        return join(dir, `${file}_${content_hash}${ext}`);
    }
    static get_hashed_files() {
        const replace_hash_files = [];
        const files = [].concat(File.collect_files('gen/css'), File.collect_files('gen/js'));
        const list = files
            .map((file) => {
                const hash = Optimize.create_hash_of_file(file);
                if (!hash) {
                    return null;
                }
                replace_hash_files.push({
                    before: file.replace('gen', ''),
                    after: hash.replace('gen', ''),
                });
                return { file, hash };
            })
            .filter((x) => x);
        return [replace_hash_files, list];
    }
    static replace_hashed_files_in_files(file_list: any[], hash_list: any[]) {
        file_list.forEach(({ file, hash }) => {
            const content = this.replace_hashed_files(File.read(file), hash_list);

            File.write(hash, content);
        });
    }
    static replace_hashed_files(content: string, hash_list: any[]) {
        hash_list.forEach(({ before, after }) => {
            content = content.replace(new RegExp(before.replace(/\//, '\\/'), 'g'), after);
        });
        return content;
    }
}
