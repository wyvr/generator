function get_nav() {
    const nav = getGlobal('nav.header', []);
    if (!nav) {
        return null;
    }
    return nav.filter((entry) => entry.visible);
}
