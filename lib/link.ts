import * as fs from 'fs-extra';

module.exports = {
    // links the given source_dir_name to the pub folder
    // e.g. to_pub('assets') => /assets -> /pub/assets
    to_pub(source_dir_name) {
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
    },
    // check if the path is a symbolic link
    is_symlink(path) {
        if (!fs.existsSync(path)) {
            return false;
        }
        const stats = fs.lstatSync(path, { throwIfNoEntry: false });
        return stats.isSymbolicLink();
    },
};
