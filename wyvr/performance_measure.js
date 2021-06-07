"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Performance_Measure_Blank = exports.Performance_Measure_Entry = exports.Performance_Measure = void 0;
var logger_1 = require("@lib/logger");
var time_1 = require("@lib/converter/time");
var Performance_Measure = /** @class */ (function () {
    function Performance_Measure() {
        this.entries = [];
    }
    Performance_Measure.prototype.start = function (name) {
        this.entries.push(new Performance_Measure_Entry(name));
    };
    Performance_Measure.prototype.end = function (name) {
        var entry = null;
        this.entries = this.entries
            .reverse()
            .filter(function (e) {
            if (e.name == name) {
                entry = e;
                return false;
            }
            return true;
        })
            .reverse();
        if (entry) {
            var hrtime = process.hrtime(entry.hrtime); // hr_end[0] is in seconds, hr_end[1] is in nanoseconds
            var timeInMs = time_1.hrtime_to_ms(hrtime);
            logger_1.Logger.log(logger_1.Logger.color.yellow('#'), logger_1.Logger.color.yellow(entry.name), logger_1.Logger.color.yellow(timeInMs.toString()), 'ms');
        }
    };
    return Performance_Measure;
}());
exports.Performance_Measure = Performance_Measure;
/**
 * Entry datatype of Performance_Measure
 */
var Performance_Measure_Entry = /** @class */ (function () {
    function Performance_Measure_Entry(name, hrtime) {
        if (hrtime === void 0) { hrtime = process.hrtime(); }
        this.name = name;
        this.hrtime = hrtime;
    }
    return Performance_Measure_Entry;
}());
exports.Performance_Measure_Entry = Performance_Measure_Entry;
var Performance_Measure_Blank = /** @class */ (function () {
    function Performance_Measure_Blank() {
    }
    Performance_Measure_Blank.prototype.start = function (name) { };
    Performance_Measure_Blank.prototype.end = function (name) { };
    return Performance_Measure_Blank;
}());
exports.Performance_Measure_Blank = Performance_Measure_Blank;
//# sourceMappingURL=performance_measure.js.map