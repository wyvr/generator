export default async function () {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, 250);
    });
}
