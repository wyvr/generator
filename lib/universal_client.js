/**
 * This is the client side of the universal code.
 */

// Cookies
export { get_cookies, set_cookie, allowed_cookie_options, allowed_same_site_values } from '../src/utils/cookies.js';


// Logger

/* eslint-disable no-alert, no-console */
/**
 * This file contains basic functions that are used in both the client and the server.
 */
const passthrough = (...args) => args;
/**
 * Client implementation of the wyvr logger.
 * @type {Logger}
 */
export const logger = {
    log: console.log,
    raw_log: console.log,
    present: console.log,
    info: console.info,
    success: console.log,
    warning: console.warn,
    error: console.error,
    improve: console.log,
    block: console.log,
    debug: console.debug,
    report: console.log,
    color: {
        // Colors
        black: passthrough,
        red: passthrough,
        green: passthrough,
        yellow: passthrough,
        blue: passthrough,
        magenta: passthrough,
        cyan: passthrough,
        white: passthrough,
        gray: passthrough,
        grey: passthrough,

        // Backgrounds
        bgBlack: passthrough,
        bgRed: passthrough,
        bgGreen: passthrough,
        bgYellow: passthrough,
        bgBlue: passthrough,
        bgMagenta: passthrough,
        bgCyan: passthrough,
        bgWhite: passthrough,

        // Modifiers
        reset: passthrough,
        bold: passthrough,
        dim: passthrough,
        italic: passthrough,
        underline: passthrough,
        inverse: passthrough,
        hidden: passthrough,
        strikethrough: passthrough
    }
};

// Error
export function get_error_message(e, filename, scope) {
    return `@${scope}\n${e.message}\n${e.stack}\nsource ${filename}`;
}

// Database
export class Database {
    constructor() {
        throw new Error('Database is not available on the client side');
    }
}
export class Migrations{
    constructor() {
        throw new Error('Migrations is not available on the client side');
    }
}
export class KeyValue{
    constructor() {
        throw new Error('KeyValue is not available on the client side');
    }
}
