import { match_interface } from './validate.js';
import { createHash as cryptoCreateHash } from 'crypto';

export function css_hash(data) {
    if (!match_interface(data, { hash: true, css: true, name: true, filename: true })) {
        return 'wyvr';
    }
    return `wyvr-${data.hash(data.css)}`;
}
export function create_hash(value) {
    const hash = cryptoCreateHash('sha256');
    hash.update(value);
    return hash.digest('hex').substring(0, 8);
}