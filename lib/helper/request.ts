import axios from 'axios';
import { Error } from '@lib/error';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const request = async (url: string, method = 'get', payload = undefined, headers = undefined) => {
    const config = {
        url,
        method,
        headers,
        data: JSON.stringify(payload),
    };
    try {
        const { data }: any = await axios(<any>config);
        if (data.error) {
            return [data.error, undefined];
        }
        if (data.errors) {
            return [data.errors, undefined];
        }
        return [undefined, data];
    } catch (e) {
        const error = Error.get(e, undefined, 'request');
        return [`request error ${error}`, undefined];
    }
};
/* eslint-enable */
