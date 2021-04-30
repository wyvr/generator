module.exports = (obj) => {
    const _enum = {};
    Object.keys(obj).forEach((key, index) => {
        const number = Math.pow(2, index);
        _enum[number] = key;
        _enum[key] = number;
    })
    return Object.freeze(_enum);
};
