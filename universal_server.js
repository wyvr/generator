/* eslint-disable no-alert, no-console */
import { Logger } from './src/utils/logger.js';

/**
 * This is the server side of the universal code.
 * Because the bundle grabs and tries to execute code which is ment for the server only.
 */

export const logger = Logger;
