/* eslint-disable no-unused-vars */
const wyvr_portal = (el, props) => {
    /* eslint-enable no-unused-vars */
    const portal_prop = el.getAttribute('data-portal');
    if (portal_prop) {
        const portal_target_selector = props[portal_prop];
        if (portal_target_selector) {
            const portal_target = document.querySelector(portal_target_selector);
            if (portal_target) {
                Array.from(el.attributes).forEach((attr) => {
                    if (attr.name != 'data-portal') {
                        portal_target.setAttribute(attr.name, attr.value);
                    }
                });
                portal_target.innerHTML = el.innerHTML;
                el.remove();

                return portal_target;
            }
        }
    }
    return el;
};
