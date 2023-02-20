export default {
    _wyvr: {
        template: 'Default',
        exec_methods: ['get'],
    },
    url: '/test',
    onExec: async () => {
        
    },
    content: ({ params }) => {
        return 'dyn content ' + params.id;
    },
};
