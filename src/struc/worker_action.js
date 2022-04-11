export const WorkerAction = {
    log: 0,
    status: 1,
    configure: 2,
    emit: 3,
    route: 4,
    transform: 5,
    generate: 6,
    build: 7,
    scripts: 8,
    inject: 9,
    cleanup: 10,
    optimize: 11,
    media: 12,
};
export function get_name(action) {
    return Object.keys(WorkerAction).find((key) => WorkerAction[key] == action);
}
