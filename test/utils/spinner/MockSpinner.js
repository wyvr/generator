export function MockSpinner(callback) {
    const spinner = {
        stopAndPersist: (data) => {
            callback(data);
            return spinner;
        },
        start: () => {
            return spinner;
        },
        succeed: (data) => {
            callback(data);
        },
        spinner: '',
        text: '',
        remove_color: false
    };
    return spinner;
}
