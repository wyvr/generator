export function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
export async function sleep_random(min, max) {
    return await sleep(Math.floor(Math.random() * (max - min + 1) + min));
}
