export const WorkerAction = {
    log: 0,
    status: 1,
    configure: 2,
    emit: 3,
    page: 4,
    transform: 5,
    compile: 6,
    build: 8,
    scripts: 9,
    optimize: 11,
    media: 12,
    dependencies: 13,
    set: 14,
    set_config_cache: 15,
    critical: 16,
    collections: 17,
    route: 18,
    mode: 19,
    heap: 20
};
export function get_name(action) {
    return Object.keys(WorkerAction).find((key) => WorkerAction[key] == action);
}
