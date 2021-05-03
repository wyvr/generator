const Enum = require('_lib/enum');

/**
 * @return {{status: number, configure:number}}
 */
module.exports = Enum({
    status: 0,
    configure: 1,
    generate: 2,
    build: 4,
});
