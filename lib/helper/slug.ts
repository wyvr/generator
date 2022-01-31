export const to_slug = (value) => {
    return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/-+/g, '-').toLowerCase();
};
