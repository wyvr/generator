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
        Array.from(elements).map((el) => {
            const target = wyvr_portal(el, wyvr_props(el));
            const name = target.getAttribute('data-hydrate');
            if (name && !wyvr_none_classes[name].loaded) {
                wyvr_none_classes[name].loaded = true;
                const script = document.createElement('script');
                script.setAttribute('src', wyvr_none_classes[name].path);
                document.body.appendChild(script);
            }
        });
    };
};
const wyvr_none_classes = {};
