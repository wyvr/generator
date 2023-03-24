/* Created with wyvr {{version}} */
export default {
    url: '/{{name}}/[awesome_param]',
    onExec: async ({ data, params, returnJSON }) => {
        // control what you want to return
        if (params.awesome_param == 'json') {
            return returnJSON({
                key: 'value',
            });
        }
        // allow modifying of the page data
        return data;
    },
    title: ({ params }) => {
        return `Some dynamic content for "${params.awesome_param}"`;
    },
    content: 'Some static content',
};
