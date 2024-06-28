import { url_join } from '$src/url.mjs';

export default {
    url: '/url/',
    onExec: async ({ returnData }) => {
        return returnData(url_join('url'), 400);
    },
};
