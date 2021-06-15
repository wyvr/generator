const pkg = require('./package.json');

module.exports = {
    url: 'generator.wyvr',
    import: {
        main: '../website/data/sample.json',
        global: '../website/data/global.json',
    },
    themes: [
        {
            name: 'Example',
            path: '../theme-example',
        },
        {
            name: 'Startpage',
            path: '../theme-startpage',
        },
        {
            path: '../broken_path_to_theme',
        },
    ],
    assets: [
        { src: '../website/node_modules/remixicon/fonts/remixicon.css', target: 'remixicon/remixicon.css' },
        { src: '../website/node_modules/remixicon/fonts/remixicon.ttf', target: 'remixicon/remixicon.ttf' },
        { src: '../website/node_modules/remixicon/fonts/remixicon.woff', target: 'remixicon/remixicon.woff' },
        { src: '../website/node_modules/remixicon/fonts/remixicon.woff2', target: 'remixicon/remixicon.woff2' },
    ],
    default_values: {
        title: 'wyvr',
        meta_description: 'Static sites made different',
        author: pkg.author,
        version: pkg.version,
        date: new Date()
    }
};
