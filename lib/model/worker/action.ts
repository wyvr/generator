export enum WorkerAction {
    log = 1 << 0,
    status = 1 << 1,
    configure = 1 << 2,
    emit = 1 << 3,
    route = 1 << 4,
    generate = 1 << 5,
    build = 1 << 6,
    scripts = 1 << 7,
    cleanup = 1 << 8,
}
