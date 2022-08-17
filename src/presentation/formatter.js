import kleur from 'kleur';
import { is_number } from '../utils/validate.js';

export function semver(version) {
    if (version == undefined) {
        return '';
    }
    if (is_number(version)) {
        version = version.toString();
    }
    if (version.indexOf('.') > -1) {
        const parts = version.split('.');
        const len = parts.length;
        const result = [];
        if (len > 0) {
            result.push(kleur.bold(parts[0]));
        }
        if (len > 1) {
            result.push('.' + parts[1]);
        }
        if (len > 2) {
            result.push(kleur.dim('.' + parts.slice(2).join('.')));
        }
        return result.join('');
    }
    return kleur.bold(version);
}
