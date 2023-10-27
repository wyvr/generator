module.exports = {
    url: '',
    worker: {
        ratio: 0,
        force_initial_build: false
    },
    svelte: {
        warning: true
    },
    releases: {
        keep: 0,
    },
    import: {
        format_processed_file: true, // boolean: whether the output of the imported and processed file should be prettyprinted or not
        measure_performance: true, // boolean: whether the import process should be performance measured
    },
    packages: null, // list of the packages which should be used
    assets: [], // list of objects { src: 'path_to_source', target: 'relative_path_in_assets' }, to copy files into the assets folder
    default_values: {}, // object which gets injected into every page
    cron: [],
};
