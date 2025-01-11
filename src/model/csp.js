import { Config } from '../utils/config.js';
import { uniq_values } from '../utils/uniq.js';
import { filled_array, filled_string, is_func } from '../utils/validate.js';
import { getRequestId } from '../vars/request_id.js';

const cspContext = new Map();

/**
 * Register the global CSP functions
 * @returns void
 */
export function register_csp() {
    if (is_func(global.getCsp)) {
        return;
    }
    global.addCsp = add_csp;
    global.addCspNonce = add_csp_nonce;
    global.getCsp = get_csp;
    global.clearCsp = clear_csp;
}

/**
 * Add a CSP directive
 * @param {string} directive
 * @param {string} value
 * @returns value
 */
export function add_csp(directive, value) {
    if (filled_string(directive) && filled_string(value)) {
        const csp = cspContext.get(getRequestId()) ?? {};
        if (!csp[directive]) {
            csp[directive] = [];
        }
        csp[directive].push(value);
        cspContext.set(getRequestId(), csp);
    }
    return value;
}

/**
 * Add a CSP nonce
 * @param {string} nonce
 * @returns nonce
 */
export function add_csp_nonce(nonce) {
    const value = `'nonce-${nonce}'`;
    add_csp('script-src', value);
    add_csp('script-src-attr', value);
    return value;
}

/**
 * Get the current CSP
 * @returns object
 */
export function get_csp() {
    return cspContext.get(getRequestId()) ?? {};
}

/**
 * Clear the current CSP
 * @returns void
 */
export function clear_csp() {
    cspContext.delete(getRequestId());
}

/**
 * Inject the CSP into the content
 * @param {string} content
 * @returns string
 */
export function inject_csp(content) {
    if (filled_string(content)) {
        return content;
    }
    const csp_config = Config.get('csp', { active: false });
    // ignore when not active
    if (!csp_config?.active) {
        return content;
    }
    let policiesContent = '';
    const policies = get_csp();

    // merge with the base csp;
    for (const [directive, value] of Object.entries(csp_config)) {
        if (['active', 'delete'].indexOf(directive) > -1) {
            continue;
        }
        if (!policies[directive]) {
            policies[directive] = [];
        }
        policies[directive].push(...value);
    }
    // convert into an array
    for (const [directive, value] of Object.entries(policies)) {
        const values = uniq_values(value).filter((v) => (csp_config.delete || []).indexOf(v) === -1);
        if (filled_array(values)) {
            continue;
        }
        policiesContent += `${directive} ${values.join(' ')};`;
    }
    clear_csp();
    return content.replace(/<head([^>]*)>/, `<head$1><meta http-equiv="Content-Security-Policy" content="${policiesContent}" />`);
}
