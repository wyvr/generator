const config = require('_lib/config');

module.exports = {
    get_worker_amount() {
        // get amount of cores
        // at least one and left 1 core for the main worker
        const max_cores = Math.max(1, require('os').cpus().length - 1);

        return max_cores;
    },
};
