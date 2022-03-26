/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const wyvr_hydrate_none = (path, elements, name, cls, trigger) => {
    wyvr_none_classes[name] = { cls, path, loaded: false };
    if (!window.wyvr) {
        window.wyvr = {};
    }
    if (window.wyvr[trigger]) {
        console.warn(path, 'hydrate trigger', trigger, 'is already defined, please use another trigger');
        return null;
    }
    window.wyvr[trigger] = () => {
        Array.from(elements).forEach((el) => {
            wyvr_props(el).then((props) => {
                const target = wyvr_portal(el, props);
                const name = target.getAttribute('data-hydrate');
                if (name && !wyvr_none_classes[name].loaded) {
                    wyvr_none_classes[name].loaded = true;
                    const script = document.createElement('script');
                    script.setAttribute('src', wyvr_none_classes[name].path);
                    document.body.appendChild(script);
                }
            });
        });
    };
};
const wyvr_none_classes = {};
