export enum WorkerAction {
    log = 1 << 0,
    status = 1 << 1,
    configure = 1 << 2,
    generate = 1 << 3,
    build = 1 << 4,
    emit = 1 << 5,
}
