export default {
    url: '/test',
    onExec: async ({data,setStatus, setHeader}) => {
        setStatus(201);
        setHeader('Custom-Head1', 'ch1');
        setHeader('Custom-Head2', ['ch2', 'ch3']);
        return data;
    },
};
