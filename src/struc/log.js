import kleur from 'kleur';

export const LogType = {
    debug: 1,
    report: 2,
    start: 3,
    block: 4,
    present: 5,
    info: 6,
    log: 7,
    improve: 8,
    success: 9,
    warning: 10,
    error: 11,
};

export function get_type_name(type) {
    return Object.keys(LogType).find((key) => LogType[key] === type);
}

export const LogIcon = {
    log: undefined,
    debug: '~',
    success: kleur.green('✔'),
    info: kleur.blue('ℹ'),
    warning: '⚠',
    error: '✖',
    present: kleur.dim('›'),
    improve: '…',
    report: '≡',
    block: '⬢',
    start: '┌',
};
export const LogColor = {
    log: undefined,
    debug: kleur.dim,
    success: undefined,
    info: undefined,
    warning: kleur.yellow,
    error: kleur.red,
    present: undefined,
    improve: kleur.magenta,
    report: kleur.cyan,
    block: kleur.blue,
    start: kleur.dim,
};
export const LogFirstValueColor = {
    log: undefined,
    debug: undefined,
    success: kleur.green,
    info: kleur.blue,
    warning: undefined,
    error: undefined,
    present: kleur.green,
    improve: undefined,
    report: undefined,
    block: undefined,
    start: undefined,
};
