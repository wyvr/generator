/**
 * Returns the global context object.
 * @returns {Window|Global} The global context object.
 */
export function context() {
    // Check for 'window' in a safe way.
    if (typeof window !== 'undefined') {
        return window;
    }
    return global;
}
