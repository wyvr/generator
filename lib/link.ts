import { mkdirSync, removeSync, symlinkSync, existsSync, lstatSync } from 'fs-extra';
import { dirname } from 'path';
export class Link {
    /**
     * links the given source_dir_name to the destination_name folder
     * @param source_dir_name directory name in the root folder which gets symlinked into the pub folder
     * @param destination_name optional set the target name in the pub folder
     * @returns whether the given parameter is correct or not
     */
    static to(source_dir_name: string, destination_name: string = null): boolean {
        const cwd = process.cwd();
        if (!source_dir_name || typeof source_dir_name != 'string') {
            return false;
        }
        if (!destination_name) {
            return false;
        }
        const trimmed_soure = source_dir_name.replace(/^\//, '');
        const trimmed_destination = destination_name.replace(/^\//, '');
        const source = `${cwd}/${trimmed_soure}`;
        const destination = `${cwd}/${trimmed_destination}`;
        // create pub folder when not exists
        mkdirSync(dirname(destination), { recursive: true });
        // when the destination exists delete it
        removeSync(destination);
        // symlink from destination to source
        symlinkSync(source, destination);
        return true;
    }
    /**
     * check if the path is a symbolic link
     * @param path absolute or relative path to check
     * @returns whether the given path is a symlink or not
     */
    static is_symlink(path: string): boolean {
        if (!existsSync(path)) {
            return false;
        }
        const stats = lstatSync(path, { throwIfNoEntry: false });
        return stats.isSymbolicLink();
    }
}
