import { is_func } from './validate.js';

/**
 * Waits until the given check_fn returns a truethy value or then the max duration occures
 * @param {Function} check_fn
 * @param {number} interval interval in which the chek_fn gets executed
 * @param {number} max maximum wait time
 * @returns {Promise<boolean>}
 */
export async function wait_for(check_fn, interval = 10, max = 10000) {
    if (!is_func(check_fn)) {
        return false;
    }
    return new Promise((resolve) => {
        const guard = setTimeout(() => {
            clearInterval(id);
            resolve(false);
        }, max);
        const id = setInterval(() => {
            const result = check_fn();
            if (result) {
                clearTimeout(guard);
                clearInterval(id);
                resolve(true);
            }
        }, interval);
    });
}

/**
 * Wait the defined duration in milliseconds
 * @param {number} duration
 * @returns {Promise}
 */
export async function wait(duration) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}
