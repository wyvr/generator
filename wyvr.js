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
        ratio: 0,
    },
    packages: [
        {
            name: '../theme-wyvr',
        },
        {
            name: '../package-remixicon',
        },
        {
            name: 'Local',
            path: '../example/local-package',
        },
        {
            name: 'Magento',
            path: '../example/magento-adapter',
        },
        // {
        //     name: 'Magento2ECX',
        //     path: 'ecx_magento_graphql',
        // },
        {
            name: 'Overrides',
            path: '../example/overrides',
        }
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
