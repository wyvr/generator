import { Logger } from '../../utils/logger.js';

/**
 * @class
 */
export class SerializableResponse {
    /**
     * The constructor for the SerializableResponse class.
     * @constructor
     */
    constructor() {
        /** @type {Object} */
        this.headers = {};

        /** @type {boolean} */
        this.complete = false;

        /** @type {number} */
        this.statusCode = 200;

        /** @type {string|undefined} */
        this.statusMessage = undefined;

        /** @type {*|undefined} */
        this.data = undefined;

        /** @type {string|undefined} */
        this.encoding = undefined;

        /** @type {string|undefined} */
        this.uid = undefined;
    }

    /**
     * Checks if headers are sent.
     * @returns {boolean}
     */
    get headersSent() {
        return this.complete;
    }

    /**
     * Checks if writable ended.
     * @returns {boolean}
     */
    get writableEnded() {
        return this.complete;
    }

    /**
     * Checks if writable finished.
     * @returns {boolean}
     */
    get writableFinished() {
        return this.complete;
    }

    /**
     * Sets the response as complete and optionally assigns data and encoding.
     * @param {*} [data]
     * @param {string} [encoding='utf8']
     */
    end(data, encoding = 'utf-8') {
        if (this.complete) {
            Logger.error('Response is already complete, can not end again');
            return;
        }
        if (data !== undefined) {
            this.data = data;
        }
        this.encoding = encoding;
        this.complete = true;
    }

    /**
     * Returns the named header.
     * @param {string} name
     * @returns {*}
     */
    getHeader(name) {
        return this.headers[name?.toLowerCase()];
    }

    /**
     * Returns all header names.
     * @returns {string[]}
     */
    getHeaderNames() {
        return Object.keys(this.headers);
    }

    /**
     * Returns all headers.
     * @returns {Object}
     */
    getHeaders() {
        return Object.assign({}, this.headers);
    }

    /**
     * Checks if a header exists.
     * @param {string} name
     * @returns {boolean}
     */
    hasHeader(name) {
        return this.headers[name?.toLowerCase()] !== undefined;
    }

    /**
     * Removes the named header.
     * @param {string} name
     */
    removeHeader(name) {
        if (this.complete) {
            Logger.error('Response is already complete, can not remove header');
            return;
        }
        delete this.headers[name?.toLowerCase()];
    }

    /**
     * Sets a header value.
     * @param {string} name
     * @param {*} value
     */
    setHeader(name, value) {
        if (this.complete) {
            Logger.error('Response is already complete, can not set header');
            return;
        }
        this.headers[name.toLowerCase()] = value;
    }

    /**
     * Writes data and sets encoding.
     * @param {*} [data]
     * @param {string} [encoding='utf8']
     */
    write(data, encoding = 'utf-8') {
        if (this.complete) {
            Logger.error('Response is already complete, can not write to it');
            return;
        }
        if (data !== undefined) {
            this.data = data;
        }
        this.encoding = encoding;
    }

    /**
     * Writes headers to the response.
     * @param {number} statusCode
     * @param {string|undefined} statusMessage
     * @param {Object} headers
     */
    writeHead(statusCode, statusMessage, headers) {
        if (this.complete) {
            Logger.error('Response is already complete, can not write head');
            return;
        }
        if (statusCode !== undefined) {
            this.statusCode = statusCode;
        }
        if (statusMessage !== undefined) {
            this.statusMessage = statusMessage;
        }
        if (headers !== undefined && typeof headers == 'object' && !Array.isArray(headers)) {
            Object.entries(headers).forEach(([key, value]) => this.setHeader(key, value));
        }
    }

    /**
     * Get serialized version of the response.
     * @returns {Object} Serialized response
     */
    serialize() {
        return {
            uid: this.uid,
            headers: this.headers,
            complete: this.complete,
            statusCode: this.statusCode,
            statusMessage: this.statusMessage,
            data: this.data,
            encoding: this.encoding,
        };
    }
}
