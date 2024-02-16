import { Logger } from './src/utils/logger.js';

/**
 * This is the server side of the universal code.
 * Because the bundle grabs and tries to execute code which is ment for the server only.
 */
export { get_cookies, set_cookie, allowed_cookie_options, allowed_same_site_values } from './src/utils/cookies.js';

export const logger = Logger;

export { get_error_message } from './src/utils/error.js';
