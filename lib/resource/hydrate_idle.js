/* eslint-disable no-console */
/* eslint-disable no-undef */
const wyvr_hydrate_idle = (path, elements, name, cls) => {
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
    Array.from(elements).forEach((el) => {
        wyvr_props(el).then((props) => {
            const target = wyvr_portal(el, props);
            wyvr_idle_observer.observe(target);
        });
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
