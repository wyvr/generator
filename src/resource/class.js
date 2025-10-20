export function wyvr_class(Class, name) {
    if (typeof name !== 'string') {
        return;
    }
    if (window.wyvr_classes[name] === undefined) {
        window.wyvr_classes[name] = {};
    }
    window.wyvr_classes[name].cls = Class;
}
