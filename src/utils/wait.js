import { is_func } from './validate.js';

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

export async function wait(duration) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}
