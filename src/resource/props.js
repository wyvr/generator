/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
window.wyvr_props = (el) => {
    /* eslint-ensable no-unused-vars */
    return new Promise((resolve) => {
        let props = {};
        const json = '{' + el.getAttribute('data-props').replace(/\|/g, '"').replace(/§"§/g, '|') + '}';
        try {
            props = JSON.parse(json);
        } catch (e) {
            console.warn(json, e);
            resolve(props);
            return;
        }

        const load_props = Object.keys(props)
            .map((prop) => {
                const value = props[prop];
                if (typeof value != 'string') {
                    return undefined;
                }
                const match = value.match(/^@\(([^)]+)\)$/);
                if (Array.isArray(match) && match.length == 2) {
                    return { prop, url: match[1] };
                }

                return undefined;
            })
            .filter((x) => x);

        // nothing to load, end here
        if (load_props.length == 0) {
            resolve(props);
            return;
        }
        const loaded = [];
        const len = load_props.length;
        // check function
        const final = (success) => {
            loaded.push(success);
            if (loaded.length == len) {
                resolve(props);
            }
        };
        // load the "hugh" props
        load_props.forEach((load_prop) => {
            fetch(load_prop.url)
                .then((val) => val.json())
                .then((json) => {
                    props[load_prop.prop] = json;
                    final(true);
                })
                .catch((e) => {
                    console.warn(load_prop, e);
                    final(false);
                });
        });
    });
};
