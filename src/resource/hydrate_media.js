import { wyvr_portal } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_props } from '@wyvr/generator/src/resource/props.js';

if(!window.wyvr_classes) {
    window.wyvr_classes = {};
}

let wyvr_media_resize_throttle_bind = false;
export function wyvr_hydrate_media(path, elements, name, cls, trigger) {
    window.wyvr_classes[name] = { cls, path, loaded: false, elements };
    for (const el of elements) {
        wyvr_props(el).then((props) => {
            wyvr_portal(el, props);
        });
    }
    if (trigger) {
        if (!window.wyvr) {
            window.wyvr = {};
        }
        window.wyvr[trigger] = () => {
            wyvr_media_init(name);
            wyvr_media_checker();
        };
    }
    if (!wyvr_media_resize_throttle_bind) {
        wyvr_media_resize_throttle_bind = true;
        window.addEventListener('resize', wyvr_media_resize_throttle);
    }
    wyvr_media_checker();
}
function wyvr_media_checker() {
    for (const name of Object.keys(window.wyvr_classes)) {
        if (!name || window.wyvr_classes[name].loaded || !window.wyvr_classes[name].elements) {
            continue;
        }
        for (const el of window.wyvr_classes[name].elements) {
            if (window.matchMedia(el.getAttribute('data-media')).matches) {
                wyvr_media_init(name);
            }
        }
    }
    const loaded = !Object.values(window.wyvr_classes).find((c) => !c.loaded);

    // when evetrything is loaded remove resize listener
    if (loaded && wyvr_media_resize_throttle_bind) {
        wyvr_media_resize_throttle_bind = false;
        window.removeEventListener('resize', wyvr_media_resize_throttle);
    }
}

function wyvr_media_init(name) {
    window.wyvr_classes[name].loaded = true;
    const script = document.createElement('script');
    script.setAttribute('src', window.wyvr_classes[name].path);
    document.body.appendChild(script);
}

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
