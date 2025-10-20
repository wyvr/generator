export function wyvr_lazy_observer(elements, fn) {
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                if (typeof fn === 'function') {
                    fn(entry.target);
                }
                observer.unobserve(entry.target);
            }
        }
    });
    for (const el of elements) {
        observer.observe(el);
    }
}
