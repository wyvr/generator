// const pkg = require('./package.json');

// module.exports = {
//     url: 'generator.wyvr',
//     worker: {
//         ratio: 0,
//     },
//     packages: [
//     ],
//     assets: [
//     ],
//     default_values: {
//         title: 'wyvr',
//         meta_description: 'static sites made different',
//         author: pkg.author,
//         version: pkg.version,
//         date: new Date(),
//     },
// };
module.exports = {
    url: 'example.wyvr',
    https: false,
    worker: {
        force_initial_build: true,
        ratio: -1,
    },
    packages: [
        {
            name: 'Web',
            path: '../example/package-web',
        },
        // {
        //     name: 'Remixicon',
        //     path: '../example/node_modules/@wyvr/package-remixicon',
        // },
        {
            name: 'Local',
            path: '../example/local-package',
        },
        {
            name: 'Form',
            path: '../example/form-package',
        },
        {
            name: 'ContentElements',
            path: '../example/package-content-elements',
        },
    ],
    default_values: {
        title: 'wyvr',
        meta_description: 'static sites made different',
        date: new Date(),
        author: 'wyvr',
        magento_adapter: {
            shop_url: 'https://stage-m-kofferworld.ecxdev.io/shop'
        }
    },
    magento_adapter: {
        graph_ql: 'https://stage-m-kofferworld.ecxdev.io/shop/graphql',
        root_category: 68,
        cache_avoid_reload: true,
        product_page_size: 1000
    }
};
