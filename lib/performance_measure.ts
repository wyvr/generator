import { Logger } from '@lib/logger';
import { hrtime_to_ms } from '@lib/converter/time';
import ora from 'ora';
import { Env } from '@lib/env';

export class Performance_Measure implements IPerformance_Measure {
    spinner = null;
    entries: Performance_Measure_Entry[] = [];
    start(name: string) {
        Logger.start(name);
        this.entries.push(new Performance_Measure_Entry(name));
    }
    end(name: string) {
        let entry = null;

        this.entries = this.entries
            .reverse()
            .filter((e) => {
                if (e.name == name) {
                    entry = e;
                    return false;
                }
                return true;
            })
            .reverse();

        if (entry) {
            var hrtime = process.hrtime(entry.hrtime); // hr_end[0] is in seconds, hr_end[1] is in nanoseconds
            const timeInMs = hrtime_to_ms(hrtime);
            Logger.stop(entry.name, timeInMs);
        }
    }
}

/**
 * Entry datatype of Performance_Measure
 */
export class Performance_Measure_Entry {
    constructor(public name: string, public hrtime: [number, number] = process.hrtime()) {}
}

export class Performance_Measure_Blank implements IPerformance_Measure {
    start(name: string) {}
    end(name: string) {}
}

export interface IPerformance_Measure {
    start(name: string): void;
    end(name: string): void;
}
