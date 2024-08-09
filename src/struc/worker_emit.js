export const WorkerEmit = {
    navigation: 1,
    page: 2,
    identifier: 3,
    identifier_list: 4,
    build: 5,
    inject_shortcode_identifier: 6,
    inject_media: 7,
    errors: 8,
    dependencies: 9,
    wyvr_config: 10,
    media: 11,
    i18n: 12,
    media_query_files: 13,
    identifier_files: 14,
    critical: 15,
    collections: 16,
    route: 17
};

export function get_name(emit) {
    return Object.keys(WorkerEmit).find((key) => WorkerEmit[key] === emit);
}
