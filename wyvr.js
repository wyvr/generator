const pkg = require('./package.json');

module.exports = {
    url: 'generator.wyvr',
    worker: {
        ratio: 0,
    },
    packages: [
    ],
    assets: [
    ],
    default_values: {
        title: 'wyvr',
        meta_description: 'static sites made different',
        author: pkg.author,
        version: pkg.version,
        date: new Date(),
    },
};
