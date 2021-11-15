const wyvr_props = (el) => {
    let props = {};
    const json = '{' + el.getAttribute('data-props').replace(/\|/g, '"').replace(/§"§/g, '|') + '}';
    try {
        props = JSON.parse(json);
    } catch (e) {
        console.warn(json, e);
    }
    return props;
};
