export function RegenerateFragment(fragment) {
    if (!fragment) {
        return { change: [], add: [], unlink: [] };
    }
    return { change: fragment.change || [], add: fragment.add || [], unlink: fragment.unlink || [] };
}
