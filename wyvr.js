export default {
    url: 'generator.wyvr',
    https: false,
    worker: {
        force_initial_build: true,
        ratio: 0,
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
            path: '../example/test',
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
