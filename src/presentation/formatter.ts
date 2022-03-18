import kleur from 'kleur';

export const semver = (version: string | number) => {
    if (version == undefined) {
        return '';
    }
    if (typeof version == 'number') {
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
};
