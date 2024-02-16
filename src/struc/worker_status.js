export const WorkerStatus = {
    undefined: 0,
    exists: 1,
    done: 2,
    idle: 3,
    busy: 4,
    dead: 5
};
export function get_name(status) {
    return Object.keys(WorkerStatus).find((key) => WorkerStatus[key] == status);
}
