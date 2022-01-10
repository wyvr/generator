export enum WorkerAction {
    log = 1 << 0,
    status = 1 << 1,
    configure = 1 << 2,
    emit = 1 << 3,
    route = 1 << 4,
    transform = 1 << 5,
    generate = 1 << 6,
    build = 1 << 7,
    scripts = 1 << 8,
    inject = 1 << 9,
    cleanup = 1 << 10,
    optimize = 1 << 11,
    media = 1 << 12,
}
