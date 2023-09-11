/* eslint-disable no-undef */
/* eslint-disable no-console */
const wyvr_media_classes = {};

/* eslint-disable no-unused-vars */
const wyvr_hydrate_media = (path, elements, name, cls, trigger) => {
    wyvr_media_classes[name] = { cls, path, loaded: false, elements };
    Array.from(elements).forEach((el) => {
        wyvr_props(el).then((props) => {
            wyvr_portal(el, props);
        });
    });
    if (trigger) {
        if (!window.wyvr) {
            window.wyvr = {};
        }
        window.wyvr[trigger] = () => {
            wyvr_lazy_init(name);
            wyvr_media_checker();
        };
    }
};
const wyvr_media_checker = () => {
    const loaded = Object.keys(wyvr_media_classes)
        .map((name) => {
            if (wyvr_media_classes[name].elements) {
                Array.from(wyvr_media_classes[name].elements).map((el) => {
                    if (name && !wyvr_media_classes[name].loaded) {
                        if (window.matchMedia(el.getAttribute('data-media')).matches) {
                            wyvr_media_init(name);
                        }
                    }
                });
                return wyvr_media_classes[name].loaded;
            }
            return false;
        })
        .every((loaded) => loaded);
    // when evetrything is loaded remove resize listener
    if (loaded) {
        window.removeEventListener('resize', wyvr_media_resize_throttle);
    }
};
const wyvr_media_init = (name) => {
    wyvr_media_classes[name].loaded = true;
    const script = document.createElement('script');
    script.setAttribute('src', wyvr_media_classes[name].path);
    document.body.appendChild(script);
};

// throttle the event, because of performance
let wyvr_resize_throttle = null;
function wyvr_media_resize_throttle() {
    if (wyvr_resize_throttle) {
        return;
    }
    wyvr_resize_throttle = setTimeout(() => {
        wyvr_resize_throttle = null;
        wyvr_media_checker();
    }, 250);
}

// resize event
window.addEventListener('resize', wyvr_media_resize_throttle);

// initial execution
window.requestIdleCallback
    ? requestIdleCallback(() => {
          wyvr_media_checker();
      })
    : wyvr_media_checker();
