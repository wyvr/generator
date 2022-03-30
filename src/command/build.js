import { check_env } from "../action/check_env.js";
// import { collect_packages } from "../action/package.js";
import { env_report } from "../presentation/env_report.js";

export const build_command = async () => {
    const check_env_report = await check_env();
    env_report(check_env_report)
    //  Build Global(storage) Data
    //  Collect packages
    // const packages = await collect_packages();
    //  Copy static files
    //  Initialize Plugins
    //  Create Translations
    //  Copy files from packages and override in the package order
    //  Build Tree of files and packages
    //  Execute Routes
    //  Transform Svelte files to client and server components
    //  Build Pages
    //  Inject Data into the pages
    //  Build Script dependencies
    //  Build Scripts
    //  Create Sitemap
    //  Create Symlinks
    //  Generate Media/Images
    //  Optimize Pages
    return 'build';
};
