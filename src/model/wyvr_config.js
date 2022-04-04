export const WyvrConfig = {
    url: 'localhost',
    worker: {
        ratio: 0,
        force_initial_build: false,
    },
    releases: {
        keep: 0,
    },
    packages: null, // list of the packages which should be used
    assets: [], // list of objects { src: 'path_to_source', target: 'relative_path_in_assets' }, to copy files into the assets folder
    default_values: {}, // object which gets injected into every page
    cron: [],
};
