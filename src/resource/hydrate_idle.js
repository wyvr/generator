import { wyvr_portal } from '@wyvr/generator/src/resource/portal.js';
import { wyvr_props } from '@wyvr/generator/src/resource/props.js';

if(!window.wyvr_classes) {
    window.wyvr_classes = {};
}

export function wyvr_hydrate_idle(path, elements, name, cls, trigger) {
    window.wyvr_classes[name] = { cls, path, loaded: false };
    window.requestIdleCallback
        ? requestIdleCallback(() => {
              wyvr_idle_init(elements);
          })
        : wyvr_idle_init(elements);
    if (trigger) {
        if (!window.wyvr) {
            window.wyvr = {};
        }
        window.wyvr[trigger] = () => {
            wyvr_idle_init(elements);
        };
    }
}

const wyvr_idle_observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            const name = entry.target.getAttribute('data-hydrate');
            if (name && !window.wyvr_classes[name].loaded) {
                window.wyvr_classes[name].loaded = true;
                const script = document.createElement('script');
                script.setAttribute('src', window.wyvr_classes[name].path);
                document.body.appendChild(script);
            }
            wyvr_idle_observer.unobserve(entry.target);
        }
    }
});

function wyvr_idle_init(elements) {
    for (const el of elements) {
        wyvr_props(el).then((props) => {
            const target = wyvr_portal(el, props);
            wyvr_idle_observer.observe(target);
        });
    }
}
