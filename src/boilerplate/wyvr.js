export default {
    cron: {
        sitemap: {
            when: '@build',
            what: 'sitemap.js',
        }
    },
    critical: {
        active: true, // enable or disable critical css generation
        // inline: false, // inline critical css into html files
        // minify: true, // minify the generated critical css
        // dimensions: [
        //     { width: 320, height: 568 },
        //     { width: 360, height: 720 },
        //     { width: 480, height: 800 },
        //     { width: 1024, height: 768 },
        //     { width: 1280, height: 1024 },
        //     { width: 1920, height: 1080 }
        // ],
        // rebase: false
    },
    csp: {
        active: false, // enable or disable the CSP feature
        delete: [], // delete the following values from all directives
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", "'unsafe-inline'", 'data:'],
    }
}