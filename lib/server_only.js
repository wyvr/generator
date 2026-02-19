if (typeof window !== 'undefined' || typeof process === 'undefined') {
    throw new Error(
        'This module is only allowed in server runtimes like Node.js, if you see this error please report it to the library author.'
    );
}
