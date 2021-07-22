const pkg = require('./package.json');

module.exports = {
    url: 'generator.wyvr',
    import: {
        global: '../website/data/global.json',
    },
    worker: {
        ratio: 0,
    },
    packages: [
        {
            name: 'Example',
            path: '../theme-example',
        },
        {
            path: '../broken_path_to_theme',
        },
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
