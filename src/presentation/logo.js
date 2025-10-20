import kleur from 'kleur';
import { semver } from './formatter.js';

export function get_logo(version) {
    // kleur.enabled = false;
    let display_version = semver(version);
    if (!display_version) {
        display_version = kleur.red('⚠ unknown version');
    } else {
        display_version = `v${display_version}`;
    }
    const logo = `${kleur.bold('wyvr')} ${display_version}`;
    return kleur.blue(logo);
}
