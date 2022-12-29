export default {
    url: '/test',
    content: (all) => {
        return JSON.stringify(all);
    },
    title: ({ returnJSON }) => {
        returnJSON({});
    },
};
