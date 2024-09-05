/**
 * Indicates whether the current execution is made on the server
 * Magic value which which are replaced when the content is built
 * @type {boolean}
 */
export const isServer = true;

/**
 * Indicates whether the current execution is made on the client/JS
 * Magic value which which are replaced when the content is built
 * @type {boolean}
 */
export const isClient = false;

/**
 * Callback which gets executed, this callback can be asynchronous
 *
 * @callback onServerCallback
 * @returns void
 * @example
 * onServer(async () => { ... })
 */

/**
 * Function which gets only executed when component gets rendered on the server
 *
 * @param {onServerCallback} callback Executed function on the server
 * @returns void
 */
export async function onServer() {}

/**
 * Callback which gets executed when the component is rendered as reqeusts, this callback can be asynchronous
 *
 * @callback onRequestCallback
 * @returns void
 * @example
 * onSRequest(async () => { ... })
 */

/**
 * Function which gets only executed when component gets rendered as request
 *
 * @param {onRequestCallback} callback Executed function on the server
 * @returns void
 */
export async function onRequest() {}

/**
 * Transform the value with this callback, this callback can be asynchronous
 *
 * @callback injectCallback
 * @param {any} [value=undefined] value of the key
 * @returns any the new value which gets injected
 * @example
 * onServer(async () => { ... })
 */

/**
 * Inject the value of the key into the component directly
 *
 * @param {string} key path to the desired value or object, dot seperated, the first part is the type config, collection, ...
 * @param {any} [fallback=undefined] fallback value if the required key is not found
 * @param {injectCallback} callback Executed before the value gets injected
 * @return {any}
 * @example
 * _inject('config.url')
 * @example
 * _inject('collection.all', [])
 */
export async function _inject() {}

/**
 * Inject the value of the key into any source file that gets transformed(contained in packages)
 * The value gets inserted while transforming into the source file
 *
 * @param {string} segment path to the desired value or object in the wyvr config
 * @param {any} fallback if the path is not found the fallback value gets inserted instead, if not defined, "undefined" is injected
 * @returns {any}
 * @example
 * injectConfig('url')
 * @example
 * injectConfig('i18n.fallback', 'en')
 */
export function injectConfig() {}
