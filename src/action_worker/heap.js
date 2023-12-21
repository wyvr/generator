import { writeHeapSnapshot } from 'v8';
import { Logger } from '../utils/logger.js';

export function create_heap_snapshot() {
    Logger.warning('create heap snapshot');
    const path = writeHeapSnapshot();
    Logger.warning('heap snapshot saved', path);
}
