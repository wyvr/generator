const wyvr_hydrate_lazy = (path, elements, name, cls) => {
    /*import(path).then(module => {
        if(!module || !module.default) {
            wyvr_hydrate(elements, module.default)
        }
    });*/
    wyvr_lazy_classes[name] = { cls, path, loaded: false };
    return Array.from(elements).map((el) => {
        const target = wyvr_portal(el, wyvr_props(el));
        wyvr_lazy_observer.observe(target);
        return target;
    });
};
const wyvr_lazy_classes = {};
const wyvr_lazy_observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const name = entry.target.getAttribute('data-hydrate');
            if (name && !wyvr_lazy_classes[name].loaded) {
                wyvr_lazy_classes[name].loaded = true;
                const script = document.createElement('script');
                script.setAttribute('src', wyvr_lazy_classes[name].path);
                document.body.appendChild(script);
            }
            wyvr_lazy_observer.unobserve(entry.target);
        }
    });
});
