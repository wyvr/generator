import kleur from 'kleur';

export const LogType = {
    log: 1,
    debug: 2,
    success: 3,
    info: 4,
    warning: 5,
    error: 6,
    present: 7,
    improve: 8,
    report: 9,
    block: 10,
    start: 11,
};

export const LogIcon = {
    log: undefined,
    debug: '~',
    success: kleur.green('✔'),
    info: kleur.blue('ℹ'),
    warning: '⚠',
    error: '✖',
    present: kleur.dim('›'),
    improve: '♥',
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
