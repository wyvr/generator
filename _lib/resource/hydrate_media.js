/* eslint-disable no-undef */
/* eslint-disable no-console */
const wyvr_media_classes = {};

/* eslint-disable @typescript-eslint/no-unused-vars */
const wyvr_hydrate_media = (path, elements, name, cls) => {
    wyvr_media_classes[name] = { cls, path, loaded: false, elements };
    Array.from(elements).forEach((el) => {
        wyvr_props(el).then((props) => {
            wyvr_portal(el, props);
        })
    })
};
const wyvr_media_checker = () => {
    const loaded = Object.keys(wyvr_media_classes)
        .map((name) => {
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
                return wyvr_media_classes[name].loaded;
            }
            return false;
        })
        .reduce((acc, cur) => (acc ? true : cur), false);
    // when evetrything is loaded remove resize listener
    if (loaded) {
        window.removeEventListener('resize', wyvr_media_resize_throttle);
    }
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
    : setTimeout(() => {
          wyvr_media_checker();
      }, 1000);
