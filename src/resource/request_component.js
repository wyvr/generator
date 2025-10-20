import { wyvr_parse_props } from 'wyvr/src/resource/props.js';

export function wyvr_request_component(el, request, fn) {
    if (!el || el.getAttribute('data-hydrated') === 'true') {
        return;
    }
    el.setAttribute('data-hydrated', 'true');
    el.setAttribute('data-wyvr', 'idle');
    const props = wyvr_parse_props(el);

    fetch(request, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(props)
    })
        .then((res) => res.json())
        .then((json) => {
            let content = '';
            let attributes = undefined;
            if (json?.html) {
                const container = document.createElement('div');
                container.innerHTML = json.html.replace(/<script[^>]*>[.]+<\/script>/gm, '');
                content = container.firstChild.innerHTML;
                attributes = container.firstChild.attributes;
            }
            if (json.css) {
                content += `<style>${json.css}</style>`;
            }
            if (json.head) {
                // include the head data when not already included
                if (document.head.innerHTML.indexOf(json.head) === -1) {
                    document.head.innerHTML += json.head;
                }
            }
            if (!content) {
                return;
            }
            el.innerHTML = content;
            if (attributes) {
                for (const attr of attributes) {
                    el.setAttribute(attr.name, attr.value);
                }
            }
            if (typeof fn === 'function') {
                fn(el, content, json, attributes);
            }
        })
        .catch((e) => {
            console.error(`error loading ${request}`, e); // eslint-disable-line no-console
        });
}
