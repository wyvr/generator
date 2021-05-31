export enum WorkerAction {
    log = 1 << 0,
    status = 1 << 1,
    configure = 1 << 2,
    emit = 1 << 3,
    generate = 1 << 4,
    build = 1 << 5,
    scripts = 1 << 6,
}
