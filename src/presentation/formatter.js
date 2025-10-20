import kleur from 'kleur';
import { is_number } from '../utils/validate.js';

export function semver(version) {
    if (version === undefined) {
        return '';
    }
    let versionStr = version;
    if (is_number(version)) {
        versionStr = version.toString();
    }
    if (versionStr.indexOf('.') === -1) {
        return kleur.bold(versionStr);
    }
    const parts = versionStr.split('.');
    const len = parts.length;
    const result = [];
    if (len > 0) {
        result.push(kleur.bold(parts[0]));
    }
    if (len > 1) {
        result.push(`.${parts[1]}`);
    }
    if (len > 2) {
        result.push(kleur.dim(`.${parts.slice(2).join('.')}`));
    }
    return result.join('');
}
