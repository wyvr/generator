export function MockSpinner(callback) {
    const spinner = {
        stopAndPersist: (data) => {
            callback(data);
            return spinner;
        },
        start: () => {
            return spinner;
        },
        spinner: '',
        text: '',
    };
    return spinner;
}
