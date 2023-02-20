export default {
    _wyvr: {
        template: 'Default',
        exec_methods: ['get'],
    },
    url: '/test',
    onExec: async () => {
        return { from_exec: true };
    },
    content: ({params}) => {
        return 'dyn content ' + params.id;
    },
};
