export default {
    cron: {
        sitemap: {
            when: '@build',
            what: 'sitemap.js',
        }
    },
    csp: {
        active: false, // enable or disable the CSP feature
        delete: [], // delete the following values from all directives
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src-elem': ["'self'", "'unsafe-inline'"],
        'style-src-attr': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", "'unsafe-inline'", 'data:'],
    }
}