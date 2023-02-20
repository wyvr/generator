export default {
    url: '/test',
    onExec: async ({returnJSON}) => {
        returnJSON({}, 404);
    },
};
