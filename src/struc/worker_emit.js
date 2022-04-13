export const WorkerEmit = {
    navigation: 1,
    route: 2,
    identifier: 3,
    identifier_list: 4,
    build: 5,
    inject_shortcode_identifier: 6,
    inject_media: 7,
    errors: 8,
};

export function get_name(emit) {
    return Object.keys(WorkerEmit).find((key) => WorkerEmit[key] == emit);
}
