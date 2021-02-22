const fs = require('fs');

const cwd = process.cwd();

module.exports = {
    // links the given source_dir_name to the pub folder
    // e.g. to_pub('assets') => /assets -> /pub/assets
    to_pub(source_dir_name) {
        const trimmed_soure = source_dir_name.replace(/^\//, '');
        const source = `${cwd}/${trimmed_soure}`;
        const destination = `${cwd}/pub/${trimmed_soure}`;
        // check if the path is a symbolic link and matches the source
        if (this.is_symlink(destination) && fs.readlinkSync(destination) === source) {
            return;
        }
        // when the destination exists delete it
        if (fs.existsSync(destination)) {
            fs.unlinkSync(destination);
        }
        // symlink from destination to source
        fs.symlinkSync(source, destination);
    },
    // check if the path is a symbolic link
    is_symlink(path) {
        const stats = fs.lstatSync(path, { throwIfNoEntry: false });
        if(!stats) {
            return false;
        }
        return stats.isSymbolicLink();
    }
};
