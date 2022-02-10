import axios from 'axios';
import { Error } from '@lib/error';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const request = async (url: string, method = 'get', payload = undefined, headers_object = undefined) => {
    const config = {
        url,
        method,
        headers: headers_object,
        data: JSON.stringify(payload),
    };
    try {
        const { data, headers }: any = await axios(<any>config);
        if (data.error) {
            return [data.error, undefined, undefined];
        }
        if (data.errors) {
            return [data.errors, undefined, undefined];
        }
        return [undefined, data, headers];
    } catch (e) {
        const error = Error.get(e, undefined, 'request');
        return [`request error ${error}`, undefined, undefined];
    }
};
/* eslint-enable */
