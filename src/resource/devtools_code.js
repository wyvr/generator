/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
async function wyvr_fetch(path) {
    if (!path) {
        return null;
    }
    let response = null;
    try {
        response = await fetch(path + '?' + Date.now());
    } catch (e) {
        return null;
    }
    if (!response) {
        return null;
    }
    try {
        const data = await response.json();
        return data;
    } catch (e) {
        return null;
    }
}
async function wyvr_devtools_inspect_data() {
    console.group('wyvr: Inspect data');
    if (window.data) {
        console.log(window.data);
        console.groupEnd();
        return window.data;
    }
    window.data = await wyvr_fetch('{release_path}');
    if (!window.data) {
        console.warn('data not available');
        console.groupEnd();
        return undefined;
    }
    console.log(window.data);
    console.info('now available inside "data"');
    console.groupEnd();
    return window.data;
}
async function wyvr_devtools_inspect_structure_data() {
    console.group('wyvr: Inspect structure');
    if (window.structure) {
        console.log(window.structure);
        console.groupEnd();
        return window.structure;
    }
    window.structure = await wyvr_fetch('/{identifier}.json');
    if (!window.structure) {
        console.warn('structure not available');
        console.info('structure is not available in routes');
        console.groupEnd();
        return undefined;
    }
    // append shortcodes when available
    // const shortcode_path = '{shortcode_path}';
    // if (shortcode_path) {
    //     const shortcodes = await wyvr_fetch(shortcode_path + '.json');
    //     if (shortcodes) {
    //         window.structure.shortcodes = shortcodes;
    //     }
    // }
    console.log(window.structure);
    console.info('now available inside "structure"');
    console.groupEnd();
    return window.structure;
}
