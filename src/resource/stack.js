/**
 * getStack function retrieves the value of a specified key from the '_stack' object in the global window object.
 *
 * @param {string} key The key of the value to be retrieved from the '_stack' object.
 * @param {string} [fallback] The fallback when the key was not found
 * 
 * @return {any} Returns the value associated with the given key if it exists in '_stack'. Otherwise, returns undefined.
 * If the input parameter is not a non-empty string or if the '_stack' object doesn't exist, the function also returns undefined.
 *
 * @example
 * // Assuming window._stack = { foo: 'bar' }
 * console.log(getStack('foo'));  // Logs: 'bar'
 *
 * @example
 * // If no _stack object is present or key does not exist in _stack
 * console.log(getStack('baz'));  // Logs: undefined
 * 
 * @example
 * // Assuming window._stack = { foo: 'bar' }
 * console.log(getStack('test', 'fallback'));  // Logs: 'fallback'
 *
 */
window.getStack = (key, fallback) => {
    if (typeof key == 'string' && key && window._stack) {
        return window._stack[key] ?? fallback;
    }
    return fallback;
};