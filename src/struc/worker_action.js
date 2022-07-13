export const WorkerAction = {
    log: 0,
    status: 1,
    configure: 2,
    emit: 3,
    route: 4,
    transform: 5,
    compile: 6,
    generate: 7,
    build: 8,
    scripts: 9,
    inject: 10,
    cleanup: 11,
    optimize: 12,
    media: 13,
    dependencies: 14,
    set: 15,
    critical: 16,
};
export function get_name(action) {
    return Object.keys(WorkerAction).find((key) => WorkerAction[key] == action);
}
