import { match_interface } from './validate.js';

export function css_hash(data) {
    if (!match_interface(data, { hash: true, css: true, name: true, filename: true })) {
        return 'wyvr';
    }
    return `wyvr-${data.hash(data.css)}`;
}
