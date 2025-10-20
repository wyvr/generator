/* eslint-disable no-console */

// @WARN potential memory leak
const wyvr_props_cache = {};

function WyvrDeferred() {
    this.promise = new Promise((resolve, reject) => {
        this.reject = reject;
        this.resolve = resolve;
    });
}
export function wyvr_parse_props(el) {
    if (!el) {
        return {};
    }
    try {
        const json = `{${transform_props(el.getAttribute('data-props'))}}`;
        return JSON.parse(json);
    } catch (e) {
        console.warn(e, el);
        return {};
    }
}
export function wyvr_props(el) {
    /* eslint-ensable no-unused-vars */
    return new Promise((resolve) => {
        const props = wyvr_parse_props(el);
        if (!props) {
            return resolve({});
        }
        const keys = Object.keys(props);
        if (!props || keys.length === 0) {
            return resolve({});
        }
        const load_props = keys
            .map((prop) => {
                const value = props[prop];
                if (typeof value !== 'string') {
                    return undefined;
                }
                const url = transform_prop_source(value);
                if (url) {
                    return { prop, url };
                }

                return undefined;
            })
            .filter((x) => x);

        // nothing to load, end here
        if (load_props.length === 0) {
            resolve(props);
            return;
        }
        const loaded = [];
        const len = load_props.length;
        // check function
        const final = (success) => {
            loaded.push(success);
            if (loaded.length === len) {
                resolve(props);
            }
        };
        // load the "hugh" props
        for (const item of load_props) {
            if (item.url.match(/\.js$/)) {
                import(item.url)
                    .then((module) => {
                        props[item.prop] = module.default;
                        final(true);
                    })
                    .catch((e) => {
                        console.warn('prop error', item, e);
                        final(false);
                    });
                continue;
            }
            // const cache_prop = window.wyvr_props_cache[item.url];
            // // when cache object a promise is, then the property is loading
            // if (cache_prop instanceof WyvrDeferred) {
            //     cache_prop.promise.then((json) => {
            //         window.wyvr_props_cache[item.url] = json;
            //         final(true);
            //     });
            //     return;
            // }
            // // otherwise it is already in cache and can be used
            // if (cache_prop) {
            //     props[item.prop] = cache_prop;
            //     final(true);
            //     return;
            // }
            // // request the prop
            // window.wyvr_props_cache[item.url] = new WyvrDeferred();
            fetch(item.url)
                .then((val) => val.json())
                .then((json) => {
                    // console.log(window.wyvr_props_cache[item.url])
                    props[item.prop] = json;
                    // resolve the deferred promise
                    // if (window.wyvr_props_cache[item.url] && window.wyvr_props_cache[item.url].resolve) {
                    //     window.wyvr_props_cache[item.url].resolve(json);
                    // }
                    // write to cache
                    // window.wyvr_props_cache[item.url] = json;
                    final(true);
                })
                .catch((e) => {
                    console.warn('prop error', item, e);
                    // in case of an error remove the entry
                    // delete window.wyvr_props_cache[item.url];
                    final(false);
                });
        }
    });
}

export function transform_prop_source(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const match = value.match(/^@\(([^)]+)\)$/);
    if (Array.isArray(match) && match.length === 2) {
        return match[1];
    }
    const fn_match = value.match(/^\$\(([^)]+)\)$/);
    if (Array.isArray(fn_match) && fn_match.length === 2) {
        return fn_match[1];
    }
}

export function transform_props(value) {
    if (typeof value !== 'string') {
        return '';
    }
    return value.replace(/\|/g, '"').replace(/§"§/g, '|').replace(/«/g, '{').replace(/»/g, '}');
}
