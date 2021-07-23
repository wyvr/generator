const wyvr_hydrate_idle = (path, elements, name, cls) => {
    /*import(path).then(module => {
        if(!module || !module.default) {
            wyvr_hydrate(elements, module.default)
        }
    });*/
    wyvr_idle_classes[name] = { cls, path, loaded: false };
    if (window.requestIdleCallback) {
        requestIdleCallback(() => {
            wyvr_idle_init(elements);
        });
    } else {
        setTimeout(() => {
            wyvr_idle_init(elements);
        }, 5000);
    }
};
const wyvr_idle_init = (elements) => {
    return Array.from(elements).map((el) => {
        const target = wyvr_portal(el, wyvr_props(el));
        wyvr_idle_observer.observe(target);
        return target;
    });
};
const wyvr_idle_classes = {};
const wyvr_idle_observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const name = entry.target.getAttribute('data-hydrate');
            if (name && !wyvr_idle_classes[name].loaded) {
                wyvr_idle_classes[name].loaded = true;
                const script = document.createElement('script');
                script.setAttribute('src', wyvr_idle_classes[name].path);
                document.body.appendChild(script);
            }
            wyvr_idle_observer.unobserve(entry.target);
        }
    });
});
