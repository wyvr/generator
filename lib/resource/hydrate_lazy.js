/* eslint-disable no-console */
/* eslint-disable no-undef */
const wyvr_hydrate_lazy = (path, elements, name, cls) => {
    wyvr_lazy_classes[name] = { cls, path, loaded: false };

    Array.from(elements).forEach((el) => {
        wyvr_props(el).then((props) => {
            const target = wyvr_portal(el, props);
            wyvr_lazy_observer.observe(target);
        });
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
