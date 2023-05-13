export const ERRORS = {
    missing: (value) => `"${value || '[something]'}" is missing`,
    critical: 'terminated wyvr because of critical errors',
    run_in_same_folder: 'current directory is wyvr root folder, please start wyvr in another directory',
    package_is_not_present: 'package.json is not present',
    package_is_not_valid: 'package.json is invalid JSON',
    wyvr_js_is_not_present: 'wyvr config file is not present',
};
