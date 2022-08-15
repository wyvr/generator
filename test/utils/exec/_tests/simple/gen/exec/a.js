export default {
    url: '/a/[id]',
    onExec: async (req, res, params) => {
        return {
            aid: isNaN(params.id) ? 0 : parseInt(params.id, 10),
        };
    },
    content: (req, res, params, data) => {
        return `A:${data.aid}`;
    },
};
