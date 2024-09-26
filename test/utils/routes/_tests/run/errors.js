export default {
    $wyvr: {
        template: 'Default',
        exec_methods: ['get'],
    },
    url: '/test',
    onExec: async () => {
        throw new Error('huhu');
    },
    content: ({ params }) => {
        return 'dyn content ' + params.id;
    },
    title: () => {
        throw new Error('hihi');
    },
};
