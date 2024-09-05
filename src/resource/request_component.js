import { wyvr_parse_props } from '@wyvr/generator/src/resource/props.js';

export function wyvr_request_component(el, request, fn) {
    if (!el || el.getAttribute('data-hydrated') === 'true') {
        return;
    }
    el.setAttribute('data-hydrated', 'true');
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
            if (json?.html) {
                const container = document.createElement('div');
                container.innerHTML = json.html.replace(/<script[^>]*>[.]+<\/script>/gm, '');
                content = container.firstChild.innerHTML;
            }
            if (json.css) {
                content += `<style>${json.css}</style>`;
            }
            if (!content) {
                return;
            }
            if (typeof fn === 'function') {
                fn(el, content, json);
            } else {
                el.innerHTML = content;
            }
        })
        .catch((e) => {
            console.error(`error loading ${request}`, e);
        });
}
