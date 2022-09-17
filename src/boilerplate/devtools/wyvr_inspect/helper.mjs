export function get_parent_node(target, condition) {
    if (typeof condition != 'function') {
        return undefined;
    }
    while (!condition(target)) {
        if (target == document.body) {
            return undefined;
        }
        target = target.parentNode;
    }
    return target;
}