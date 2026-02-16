export * from './route.js';
export * from './config.js';
export * from './cache.js';
export * from './cli.js';
export * from './collection.js';

import { register_stack } from '../src/utils/global.js';

if (typeof window !== 'undefined' || typeof process === 'undefined') {
    throw new Error(
        'This module is only allowed in server runtimes like Node.js, if you see this error please report it to the library author.'
    );
}

register_stack();