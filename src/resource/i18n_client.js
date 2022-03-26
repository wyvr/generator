/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let wyvr_i18n_res = {};
const wyvr_i18n = __I18N__;
if (wyvr_i18n_tr) {
    wyvr_i18n.init(wyvr_i18n_tr);
}
window.__ = (key, options) => {
    return wyvr_i18n.__(key, options);
};
