import process from 'process';

process.title = `wyvr worker ${process.pid}`;

process.on('message', async (msg) => {
    console.log(process.pid, msg);
});
