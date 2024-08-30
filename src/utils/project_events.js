import { join } from 'node:path';
import { Cwd } from '../vars/cwd.js';
import { collect_files } from './file.js';
import { filled_array, filled_string, is_func, is_null } from './validate.js';
import { append_cache_breaker } from './cache_breaker.js';
import { Logger } from './logger.js';
import { get_error_message } from './error.js';
import { Event } from './event.js';
import { PROJECT_EVENT } from '../constants/project_events.js';

let active_events = {};

export async function collect_project_events(folder) {
    if (!filled_string(folder)) {
        return undefined;
    }
    const events = {};
    const files = collect_files(folder);
    if (!filled_array(files)) {
        return undefined;
    }

    const cwd = Cwd.get();
    await Promise.all(
        files.map(async (file_path) => {
            try {
                const file = join(cwd, append_cache_breaker(file_path));
                const event_result = (await import(file)).default;
                if (is_null(event_result)) {
                    return undefined;
                }
                for (const [name, event] of Object.entries(event_result)) {
                    if (!events[name]) {
                        events[name] = [];
                    }
                    events[name].push({
                        source: file_path,
                        fn: event
                    });
                }
            } catch (e) {
                Logger.error('error in event', file_path, get_error_message(e, file_path, 'event'));
                return undefined;
            }
        })
    );
    return events;
}

export async function update_project_events(folder) {
    const events = await collect_project_events(folder);
    if (events) {
        apply_project_events(events);
    }
}

export function apply_project_events(events) {
    if (!events) {
        return;
    }
    // remove the old events
    for (const [name, ids] of Object.entries(active_events)) {
        for (const id of ids) {
            Event.off(PROJECT_EVENT, name, id);
        }
    }
    active_events = {};
    // bind new ones
    for (const [name, entries] of Object.entries(events)) {
        active_events[name] = [];
        for (const entry of entries) {
            if (!is_func(entry?.fn)) {
                continue;
            }
            const id = Event.on(PROJECT_EVENT, name, entry.fn);
            active_events[name].push(id);
        }
    }
}

export function get_active_events_count() {
    let count = 0;
    for (const ids of Object.values(active_events)) {
        count += ids.length;
    }
    return count;
}
