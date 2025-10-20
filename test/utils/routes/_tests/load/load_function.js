export default function (context) {
    if (context?.returnData) {
        return {
            title: 'test context',
        };
    }
    return {
        title: 'test',
    };
}
