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
            globals: {
                window: 'readonly',
                document: 'readonly',
                __I18N__: 'readonly',
                fetch: 'readonly',
                CustomEvent: 'readonly',
                getStack: 'readonly',
            },
        },
    },
];