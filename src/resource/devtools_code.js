/* eslint-disable no-console */

async function wyvr_fetch(path) {
    if (!path) {
        return null;
    }
    let response = null;
    try {
        response = await fetch(`${path}?${Date.now()}`);
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
    if (window.data) {
        return window.data;
    }
    let url = document.location.pathname;
    if (!url.endsWith('.html')) {
        url = `${url.replace(/\/$/, '')}/index.html`;
    }

    window.data = await wyvr_fetch(url.replace('.html', '.wyvr.json')); // @TODO should be loaded based on the current url
    if (!window.data) {
        console.warn('wyvr: data not available');
        return undefined;
    }
    console.log('wyvr: data', window.data);
    return window.data;
}
async function wyvr_devtools_inspect_structure_data() {
    if (window.structure) {
        return window.structure;
    }
    window.structure = await wyvr_fetch('/{identifier}.wyvr.json');
    if (!window.structure) {
        console.warn('wyvr: structure not available');
        return undefined;
    }
    // append shortcodes when available
    const shortcode_path = '{shortcode}';
    if (shortcode_path) {
        const shortcodes = await wyvr_fetch(`/${shortcode_path}.wyvr.json`);
        if (shortcodes) {
            window.structure.shortcode = shortcodes?.shortcode;
        }
    }
    console.log('wyvr: structure', window.structure);
    return window.structure;
}
