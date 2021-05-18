const logger = require('@lib/logger');
module.exports = {
    entries: [],
    start(name) {
        this.entries.push({ name, hrtime: process.hrtime() });
    },
    end(name) {
        let entry = null;

        this.entries = this.entries
            .reverse()
            .filter((e) => {
                if(e.name == name){
                    entry = e;
                    return false;
                }
                return true;
            })
            .reverse();

        if(entry) {
            var hrtime = process.hrtime(entry.hrtime); // hr_end[0] is in seconds, hr_end[1] is in nanoseconds
            const timeInMs = (hrtime[0] * 1000000000 + hrtime[1]) / 1000000;
            logger.log(logger.color.yellow('#'), logger.color.yellow(entry.name), logger.color.yellow(timeInMs), 'ms');
        }
    },
};
