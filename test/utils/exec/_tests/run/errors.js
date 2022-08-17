export default {
    _wyvr: {
        template: 'Default',
        exec_methods: ['get'],
    },
    url: '/test',
    onExec: async (req, res, params) => {
        throw new Error('huhu');
    },
    content: (req, res, params, data) => {
        return 'dyn content ' + params.id;
    },
    title: ()=> {
        throw new Error('hihi');
    }
};
