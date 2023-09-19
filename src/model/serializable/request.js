/**
 * Convert a request into a serializable format, applying default values.
 *
 * @param {Object} request - The original request object to be serialized.
 * @param {Object} [default_values={}] - Default values to use for the serialized request.
 *
 * @returns {Object|undefined} The serialized request object. If the url is not present in the request, it returns undefined.
 */
export function SerializableRequest(request, default_values = {}) {
    const ser_req = { ...default_values };
    for (const key of ['httpVersionMajor', 'httpVersionMinor', 'httpVersion', 'url', 'method']) {
        ser_req[key] = request[key] || ser_req[key];
    }
    if (!ser_req.url) {
        return undefined;
    }
    if (!ser_req.method) {
        ser_req.method = 'GET';
    }
    for (const key of ['query', 'body']) {
        ser_req[key] = request[key] || {};
    }
    for (const key of ['files']) {
        ser_req[key] = request[key] || [];
    }
    return ser_req;
}
