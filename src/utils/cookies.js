/**
 * Parses a cookie string and returns an object containing all cookies as key-value pairs.
 * @param {string} cookie_string - The cookie string to be parsed.
 * @returns {Object} - An object containing all cookies as key-value pairs.
 */
export function get_cookies(cookie_string) {
    // check if cookies exist in the document. If not, return an empty object.
    if (!cookie_string || typeof cookie_string !== 'string') {
        return {};
    }
    // split the cookies string into an array by '; '
    const cookies = cookie_string.split('; ');

    // initialize an empty object to hold cookie key-value pairs
    const cookie_object = {};

    // loop through each item in the cookies array
    for (const cookie of cookies) {
        // split each cookie into its key and value parts
        // if there is no '=' in the cookie, it is a boolean cookie and we set its value to true
        const index = cookie.indexOf('=');
        if (index < 0) {
            cookie_object[cookie.trim()] = true;
            continue;
        }
        const key = cookie.slice(0, index).trim();
        const value = cookie.slice(index + 1).trim();
        // add the key-value pair to the cookie_object
        cookie_object[key] = value;
    }
    // return the cookie_object containing all cookies as key-value pairs
    return cookie_object;
}

/**
 * Sets a cookie with the specified key, value, and options.
 *
 * @param {string} key - The key of the cookie.
 * @param {string} value - The value of the cookie.
 * @param {Object} options - The options for the cookie.
 * @param {string} [options.Path='/'] - The path for the cookie.
 * @param {string} [options.Domain=undefined] - The domain for the cookie.
 * @param {string} [options.Expires=undefined] - The expiration date of the cookie.
 * @param {string} [options.SameSite='Strict'] - The same-site attribute of the cookie.
 * @param {boolean} [options.Secure=true] - The secure attribute of the cookie.
 * @param {boolean} [options.HttpOnly=true] - The httpOnly attribute of the cookie. Forbids JavaScript from accessing the cookie.
 * @returns {string} The formatted cookie string.
 */
export function set_cookie(key, value, options = null) {
    const data = {
        Path: '/',
        Domain: undefined,
        Expires: undefined,
        SameSite: 'Strict',
        Secure: true,
        HttpOnly: true
    };
    let cookie_value = value;
    // allow deleting of cookies by setting the value to undefined
    if (value === undefined) {
        data.Expires = 'Thu, 01 Jan 1970 00:00:01 GMT';
        cookie_value = '';
    }
    // merge the options with the default values
    if (options) {
        const normalized_options = allowed_cookie_options.map((v) => v.toLowerCase());
        for (const [key, value] of Object.entries(options)) {
            const index = normalized_options.indexOf(key.toLowerCase());
            if (index >= 0) {
                data[allowed_cookie_options[index]] = value;
            }
        }
    }

    // create the cookie string
    const cookie = [`${key}=${cookie_value}`];
    for (const opt of allowed_cookie_options) {
        if (data[opt] === undefined) {
            continue;
        }
        // handle boolean options
        if (opt === 'Secure' || opt === 'HttpOnly') {
            if (data[opt] === true) {
                cookie.push(opt);
            }
            continue;
        }
        // ignore invalid sameSite values
        if (opt === 'SameSite' && !allowed_same_site_values.includes(data[opt])) {
            continue;
        }
        cookie.push(`${opt}=${data[opt]}`);
    }
    return `${cookie.join('; ')};`;
}

export const allowed_cookie_options = ['Path', 'Domain', 'Expires', 'SameSite', 'Secure', 'HttpOnly'];

export const allowed_same_site_values = ['Strict', 'Lax', 'None'];
