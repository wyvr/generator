const wyvr_hydrate_media = (path, elements, name, cls) => {
    /*import(path).then(module => {
        if(!module || !module.default) {
            wyvr_hydrate(elements, module.default)
        }
    });*/
    wyvr_media_classes[name] = { cls, path, loaded: false, elements };
    wyvr_media_init(elements);
    // if (window.requestIdleCallback) {
    //     requestIdleCallback(() => {
    //         wyvr_idle_init(elements);
    //     });
    // } else {
    //     setTimeout(() => {
    //         wyvr_idle_init(elements);
    //     }, 5000);
    // }
};
const wyvr_media_init = (elements) => {
    return Array.from(elements).map((el) => {
        const target = wyvr_portal(el, wyvr_props(el));
        return target;
    });
};

const wyvr_media_classes = {};
const wyvr_media_observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const name = entry.target.getAttribute('data-hydrate');
            if (name && !wyvr_media_classes[name].loaded) {
                if (window.matchMedia(entry.target.getAttribute('data-media')).matches) {
                    wyvr_media_classes[name].loaded = true;
                    const script = document.createElement('script');
                    script.setAttribute('src', wyvr_media_classes[name].path);
                    document.body.appendChild(script);
                    wyvr_idle_observer.unobserve(entry.target);
                }
            }
        }
    });
});
const wyvr_media_checker = () => {
    Object.keys(wyvr_media_classes).forEach((name) => {
        if (wyvr_media_classes[name].elements) {
            Array.from(wyvr_media_classes[name].elements).map((el) => {
                if (name && !wyvr_media_classes[name].loaded) {
                    if (window.matchMedia(el.getAttribute('data-media')).matches) {
                        wyvr_media_classes[name].loaded = true;
                        const script = document.createElement('script');
                        script.setAttribute('src', wyvr_media_classes[name].path);
                        document.body.appendChild(script);
                    }
                }
            });
        }
    });
};
let wyvr_resize_debouncer = null;
window.addEventListener('resize', () => {
    if (wyvr_resize_debouncer) {
        clearTimeout(wyvr_resize_debouncer);
    }
    wyvr_resize_debouncer = setTimeout(() => {
        wyvr_media_checker();
    }, 250);
});
if (window.requestIdleCallback) {
    requestIdleCallback(() => {
        wyvr_media_checker();
    });
} else {
    setTimeout(() => {
        wyvr_media_checker();
    }, 1000);
}
