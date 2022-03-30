export const ERRORS = {
    missing: (value) => {
        `"${value || '[something]'}" is missing`;
    },
    critical: 'terminated wyvr because of critical errors',
    run_in_same_folder: 'current directory is wyvr root folder, please start wyvr in another directory',
};
