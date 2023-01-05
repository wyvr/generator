import { test } from '@src/test.mjs';

export default {
    test: {
        after: async ({ result }) => {
            result.data.test = test();
            return result;
        },
    },
};
