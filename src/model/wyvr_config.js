import { Env } from '../vars/env.js';

export const WyvrConfig = Object.freeze({
    assets: [], // list of objects { src: 'path_to_source', target: 'relative_path_in_assets' }, to copy files into the assets folder
    cron: {},
    default_values: {}, // object which gets injected into every page
    env: Env.name(),
    https: true,
    i18n: {
        fallback: 'en'
    },
    packages: [], // list of the packages which should be used
    releases: {
        keep: 0
    },
    url: 'localhost',
    worker: {
        ratio: 0.3,
        force_initial_build: false
    }
});
