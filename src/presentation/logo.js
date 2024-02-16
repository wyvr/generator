import kleur from 'kleur';
import { semver } from './formatter.js';

export function get_logo(version) {
    // kleur.enabled = false;
    let display_version = semver(version);
    if (!display_version) {
        display_version = kleur.red('⚠ unknown version');
    }
    const logo = [`__  __  __  __  __  ____`, `╲ ╲╱ ╱╲╱ ╱╲╱ ╱╲╱ ╱╲╱ ╱_╱`, ` ╲╱_╱╲╱_╱╲╱ ╱╲╱_╱╲╱_╱`, `         ╱_╱ ${kleur.bold('generator')} ${display_version}`].join('\n');
    return kleur.blue(logo);
}
