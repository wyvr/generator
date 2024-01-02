/**
 * Returns the global context object.
 * @returns {Window|Global} The global context object.
 */
export function context() {
    // Check for 'window' in a safe way.
    if (typeof window !== 'undefined') {
        return window;
    }
    // Check for 'global' in a safe way.
    else if (typeof global !== 'undefined') {
        return global;
    }
}
