/* Created with wyvr {{version}} */
export default {
    url: '{{url}}',
    i18n: {
        // Fallback language when the requested translation is not available
        fallback: 'en',
    },
    packages: [
        {{local_package}}
        // Add packages from npm, must be installed in package.json
        /*{
            name: 'package_name'
        },*/
    ],
    // Allow loading of images from different sources(image proxy)
    /*media: {
        allowed_domains: ['<your_media_domain>'],
    },*/

    // Control how much previous releases should be kept
    /*releases: {"keep":0},*/

    // Control how much of the available cpu cores should be used for building 0 => at least 1 core and 1 => 100% of all cores
    /*worker: {"ratio":0},*/

    // Set custom port
    /*port: 3000,*/

    // List of files which should be copied into assets folder
    /*assets: [
        { src: 'path_to_source', target: 'relative_path_in_assets' }
    ],*/

    // Object which gets injected into every page, please do not add sensitive data in here, this can be visible in the result page
    default_values: {
        /*key: 'value',*/
    },

    // Add Cron jobs, which gets executed with `wyvr cron`
    /*cron: {
        unique_name: {
            when: '* * * * *', // every minute
            what: 'relative_path_to_file_from_cron_folder',
            options: {
                custom: 'options'
            }
        }
    },*/
    {{cron_code}}
};
