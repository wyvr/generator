module.exports = (...values) => {
    const _enum = {};
    values.forEach((value, index) => {
        const number = Math.pow(2, index);
        _enum[number] = value;
        _enum[value] = number;
    })
    return Object.freeze(_enum);
};
