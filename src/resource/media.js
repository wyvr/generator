export function wyvr_media(name, elements, fn) {
    if (!window.wyvr_media_checker) {
        window.wyvr_media_checker = {};
        // add global resize checker
        window.addEventListener('resize', wyvr_media_resize_throttle);
    }
    window.wyvr_media_checker[name] = { elements, fn };
    wyvr_media_resize_throttle();
    return {
        check: wyvr_media_resize_throttle,
        revoke: () => {
            delete window.wyvr_media_checker[name];
        }
    };
}

function check_and_update() {
    for (const [name, entry] of Object.entries(window.wyvr_media_checker)) {
        const remaining_elements = [];
        for (const el of entry.elements) {
            const media = el.getAttribute('data-media');
            if (window.matchMedia(media).matches) {
                if (typeof entry.fn === 'function') {
                    entry.fn(el, media);
                }
                continue;
            }
            // when media query doesn't match keep the element
            remaining_elements.push(el);
        }
        //  remove the entry, when no remaining elements are available
        if (remaining_elements.length === 0) {
            delete window.wyvr_media_checker[name];
        }
    }
}

// throttle the event, because of performance
let wyvr_resize_throttle = null;
function wyvr_media_resize_throttle() {
    if (wyvr_resize_throttle) {
        return;
    }
    wyvr_resize_throttle = setTimeout(() => {
        wyvr_resize_throttle = null;
        check_and_update();
    }, 250);
}
