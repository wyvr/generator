const config = require('_lib/config');
const worker_ratio = config.get('worker.ratio');

module.exports = {
    get_worker_amount() {
        // get amount of cores
        // at least one and left 1 core for the main worker
        const cpu_cores = require('os').cpus().length;
        const cpu_cores_ratio = Math.round(cpu_cores * worker_ratio);
        const max_cores = Math.max(1, cpu_cores_ratio - 1);

        return max_cores;
    },
    
};
