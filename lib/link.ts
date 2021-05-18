import * as fs from 'fs-extra';

export class Link {
    /**
     * links the given source_dir_name to the pub folder
     * @example to_pub('assets') => /assets -> /pub/assets
     * @param source_dir_name directory name in the root folder which gets symlinked into the pub folder
     * @returns whether the given parameter is correct or not
     */
    static to_pub(source_dir_name: string): boolean {
        const cwd = process.cwd();
        if (!source_dir_name || typeof source_dir_name != 'string') {
            return false;
        }
        const trimmed_soure = source_dir_name.replace(/^\//, '');
        const source = `${cwd}/${trimmed_soure}`;
        const destination = `${cwd}/pub/${trimmed_soure}`;
        // create pub folder when not exists
        fs.mkdirSync(`${cwd}/pub`, { recursive: true });
        // when the destination exists delete it
        fs.removeSync(destination);
        // symlink from destination to source
        fs.symlinkSync(source, destination);
        return true;
    }
    /**
     * check if the path is a symbolic link
     * @param path absolute or relative path to check
     * @returns whether the given path is a symlink or not
     */
    static is_symlink(path: string): boolean {
        if (!fs.existsSync(path)) {
            return false;
        }
        const stats = fs.lstatSync(path, { throwIfNoEntry: false });
        return stats.isSymbolicLink();
    }
}
