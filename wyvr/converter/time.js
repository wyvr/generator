"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hrtime_to_ms = void 0;
/**
 * return the milliseconds of an hrtime entry
 * @param hrtime process.hrtime
 * @returns hrtime as milliseconds
 */
function hrtime_to_ms(hrtime) {
    if (!hrtime) {
        return 0;
    }
    return (hrtime[0] * 1000000000 + hrtime[1]) / 1000000;
}
exports.hrtime_to_ms = hrtime_to_ms;
//# sourceMappingURL=time.js.map