/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const wyvr_hydrate_lazy = (path, elements, name, cls, trigger) => {
    wyvr_lazy_classes[name] = { cls, path, loaded: false };

    Array.from(elements).forEach((el) => {
        wyvr_props(el).then((props) => {
            const target = wyvr_portal(el, props);
            wyvr_lazy_observer.observe(target);
        });
    });
    if (trigger) {
        if (!window.wyvr) {
            window.wyvr = {};
        }
        window.wyvr[trigger] = () => {
            Array.from(elements).forEach((el) => {
                wyvr_lazy_init(el);
            });
        };
    }
};
const wyvr_lazy_classes = {};
const wyvr_lazy_observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            wyvr_lazy_init(entry.target);
            wyvr_lazy_observer.unobserve(entry.target);
        }
    });
});
const wyvr_lazy_init = (element) => {
    const name = element.getAttribute('data-hydrate');
    if (name && !wyvr_lazy_classes[name].loaded) {
        wyvr_lazy_classes[name].loaded = true;
        const script = document.createElement('script');
        script.setAttribute('src', wyvr_lazy_classes[name].path + '?bid=' + window.build_id);
        document.body.appendChild(script);
    }
};
