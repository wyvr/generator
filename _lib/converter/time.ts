/**
 * return the milliseconds of an hrtime entry
 * @param hrtime process.hrtime
 * @returns hrtime as milliseconds
 */
export function hrtime_to_ms(hrtime: [number, number]) {
    if (!hrtime || !Array.isArray(hrtime) || hrtime.length != 2 || hrtime.some((t) => isNaN(t))) {
        return 0;
    }
    return (hrtime[0] * 1000000000 + hrtime[1]) / 1000000;
}
