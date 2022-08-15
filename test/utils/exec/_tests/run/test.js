export default {
    _wyvr: {
        template: 'Default',
        exec_methods: ['get'],
    },
    url: '/test',
    onExec: async (req, res, params) => {
        return { from_exec: true };
    },
    content: (req, res, params, data) => {
        return 'dyn content';
    },
};
