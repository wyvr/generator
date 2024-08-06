export default [
    {
        ignores: [
            '.nyc_output',
            '.vscode',
            'cache',
            'coverage',
            'gen',
            'node_modules',
            'pub',
            'releases',
            'test',
            'wyvr',
            'src/templates',
        ],
    },
    {
        rules: { 'no-console': 2 },
        languageOptions: {
            globals: [
                'window',
                'document',
                '__I18N__',
                'fetch',
                'CustomEvent',
                'getStack',
            ],
        },
    },
];