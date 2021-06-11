module.exports = {
    url: 'generator.wyvr',
    import : {
        main: '../website/data/sample.json',
        global: '../website/data/global.json'
    },
    themes: [
        {
            name: 'Example',
            path: '../theme-example'
        },
        {
            name: 'Startpage',
            path: '../theme-startpage'
        },
        {
            path: '../broken_path_to_theme'
        },
    ],
};
